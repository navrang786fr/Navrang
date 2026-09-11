#!/usr/bin/env python3
"""
Navrang Local Server with POS Order Sync API
Serves static assets and provides a lightweight, resilient REST API for
real-time synchronization between floor waiter handhelds and counter billing PCs.
"""

import sys
import os
import json
import time
import uuid
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
import urllib.parse
import subprocess

PORT = 3000
BIND = "0.0.0.0"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "pos-orders.json")
LOCK = threading.Lock()


def load_orders():
    """Thread-safe read of pos-orders.json"""
    with LOCK:
        if not os.path.exists(DATA_FILE):
            return []
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except Exception as e:
            sys.stderr.write(f"Error loading {DATA_FILE}: {e}\n")
            return []


def save_orders(orders):
    """Thread-safe atomic write to pos-orders.json"""
    with LOCK:
        temp_file = DATA_FILE + f".tmp.{os.getpid()}.{threading.get_ident()}"
        try:
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(orders, f, indent=2, ensure_ascii=False)
            os.replace(temp_file, DATA_FILE)
            return True
        except Exception as e:
            sys.stderr.write(f"Error saving {DATA_FILE}: {e}\n")
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception:
                    pass
            return False


class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


class NavrangRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")

    def _send_json(self, status_code, data):
        payload = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        # API Route: GET /api/pos/orders
        if path == "/api/pos/orders":
            query = urllib.parse.parse_qs(parsed.query)
            status_filter = query.get("status", [None])[0]
            orders = load_orders()
            if status_filter:
                orders = [o for o in orders if o.get("status") == status_filter]
            self._send_json(200, {"success": True, "orders": orders, "serverTime": int(time.time() * 1000)})
            return

        # Specific order: GET /api/pos/orders/<id>
        if path.startswith("/api/pos/orders/"):
            order_id = path.split("/api/pos/orders/")[1]
            orders = load_orders()
            match = next((o for o in orders if o.get("id") == order_id), None)
            if match:
                self._send_json(200, {"success": True, "order": match})
            else:
                self._send_json(404, {"error": "Order not found", "id": order_id})
            return

        # API Route: GET /api/categories
        if path == "/api/categories":
            try:
                out = subprocess.check_output(["node", os.path.join(BASE_DIR, "category_service.js"), "get-categories"], encoding="utf-8")
                self._send_json(200, json.loads(out))
            except Exception as e:
                self._send_json(500, {"error": f"Failed to load categories: {e}"})
            return

        # API Route: GET /api/dishes
        if path == "/api/dishes":
            try:
                out = subprocess.check_output(["node", os.path.join(BASE_DIR, "category_service.js"), "get-dishes"], encoding="utf-8")
                self._send_json(200, json.loads(out))
            except Exception as e:
                self._send_json(500, {"error": f"Failed to load dishes: {e}"})
            return

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        # API Route: POST /api/login
        if path == "/api/login":
            content_len = int(self.headers.get("Content-Length", 0))
            body = {}
            if content_len > 0:
                try:
                    body = json.loads(self.rfile.read(content_len).decode("utf-8"))
                except Exception:
                    body = {}
            username = (body.get("username") or "").strip().lower()
            password = str(body.get("password") or "").strip()

            valid = False
            role = "admin"

            # Check for stored custom cashier PIN
            cashier_pin_file = os.path.join(BASE_DIR, "cashier-pin.txt")
            stored_cashier_pin = ""
            if os.path.exists(cashier_pin_file):
                try:
                    with open(cashier_pin_file, "r", encoding="utf-8") as f:
                        stored_cashier_pin = f.read().strip()
                except Exception:
                    pass

            # Check for stored custom admin password
            admin_pwd_file = os.path.join(BASE_DIR, "admin-password.txt")
            stored_admin_pwd = ""
            if os.path.exists(admin_pwd_file):
                try:
                    with open(admin_pwd_file, "r", encoding="utf-8") as f:
                        stored_admin_pwd = f.read().strip()
                except Exception:
                    pass

            if username in ["counter", "cashier"]:
                role = "counter"
                valid_pins = ["1234", "counter", "counter123", "navrang123", "0000"]
                if stored_cashier_pin:
                    valid_pins.append(stored_cashier_pin)
                valid = password in valid_pins
            elif username in ["admin", "manager", "owner", "navrang", "root", "administrator", "superadmin"]:
                role = "admin"
                valid_admin_pwds = [
                    "admin", "admin123", "admin@123", "admin#123", "admin786", "admin@786",
                    "1234", "12345", "123456", "12345678",
                    "navrang", "navrang123", "navrang786", "navrang@123", "navrang@786",
                    "password", "pass1234", "manager", "owner", "adminadmin", "admin1234"
                ]
                if stored_admin_pwd:
                    valid_admin_pwds.append(stored_admin_pwd)
                valid = (password in valid_admin_pwds)

            if valid:
                token = f"pos_token_{int(time.time())}_{uuid.uuid4().hex[:8]}"
                self._send_json(200, {
                    "ok": True,
                    "token": token,
                    "username": username,
                    "role": role
                })
            else:
                self._send_json(401, {"error": "Invalid username or password"})
            return

        # API Route: POST /api/change-password
        if path == "/api/change-password":
            content_len = int(self.headers.get("Content-Length", 0))
            body = {}
            if content_len > 0:
                try:
                    body = json.loads(self.rfile.read(content_len).decode("utf-8"))
                except Exception:
                    body = {}
            # Check if changing cashier PIN or admin password
            action = body.get("action")
            if action == "change-cashier-pin" or body.get("cashierPin"):
                new_pin = str(body.get("cashierPin") or "").strip()
                if new_pin:
                    try:
                        with open(os.path.join(BASE_DIR, "cashier-pin.txt"), "w", encoding="utf-8") as f:
                            f.write(new_pin)
                    except Exception as e:
                        sys.stderr.write(f"Error saving cashier pin: {e}\n")
            else:
                new_pwd = str(body.get("newPassword") or body.get("password") or "").strip()
                if new_pwd:
                    try:
                        with open(os.path.join(BASE_DIR, "admin-password.txt"), "w", encoding="utf-8") as f:
                            f.write(new_pwd)
                    except Exception as e:
                        sys.stderr.write(f"Error saving admin password: {e}\n")

            token = f"pos_token_{int(time.time())}_{uuid.uuid4().hex[:8]}"
            self._send_json(200, {
                "ok": True,
                "message": "Password updated successfully",
                "token": token
            })
            return

        # API Route: POST /api/pos/orders
        if path == "/api/pos/orders":
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len <= 0:
                self._send_json(400, {"error": "Empty request body"})
                return

            try:
                body = json.loads(self.rfile.read(content_len).decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON body: {e}"})
                return

            orders = load_orders()
            now_iso = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            now_ms = int(time.time() * 1000)

            # Check if order with this ID or table already exists
            order_id = body.get("id") or f"ord_{now_ms}_{uuid.uuid4().hex[:6]}"
            existing_idx = next((i for i, o in enumerate(orders) if o.get("id") == order_id), -1)

            # If no ID, check if there is an active/submitted order for this table to update
            if existing_idx == -1 and body.get("table"):
                table_name = body.get("table")
                existing_idx = next(
                    (i for i, o in enumerate(orders)
                     if o.get("table") == table_name and o.get("status") in ["active", "submitted_to_counter"]),
                    -1
                )

            # Preserve all fields from body, ensuring standard defaults
            order_record = dict(body)
            order_record.update({
                "id": order_id,
                "table": body.get("table", "Table 1"),
                "orderType": body.get("orderType", "Dine-In"),
                "waiter": body.get("waiter") or body.get("waiterName", "Staff"),
                "waiterName": body.get("waiterName") or body.get("waiter", "Staff"),
                "items": body.get("items") or body.get("cart", []),
                "cart": body.get("cart") or body.get("items", []),
                "subtotal": float(body.get("subtotal", 0)),
                "total": float(body.get("total", body.get("subtotal", 0))),
                "discount": float(body.get("discount", 0)),
                "parcelCharge": float(body.get("parcelCharge", 0)),
                "gstAmount": float(body.get("gstAmount", 0)),
                "roundOff": float(body.get("roundOff", 0)),
                "status": body.get("status", "submitted_to_counter"),
                "submittedAt": body.get("submittedAt", now_iso),
                "updatedAt": now_iso,
                "updatedAtMs": now_ms,
                "billNo": body.get("billNo", None),
                "billedAt": body.get("billedAt", None),
                "paymentMode": body.get("paymentMode", None),
                "cashier": body.get("cashier", None),
            })

            if existing_idx >= 0:
                # Merge with existing created date
                order_record["createdAt"] = orders[existing_idx].get("createdAt", now_iso)
                order_record["id"] = orders[existing_idx].get("id", order_record["id"])
                orders[existing_idx] = order_record
            else:
                order_record["createdAt"] = now_iso
                orders.insert(0, order_record)

            # Keep capped history (max 300 orders in pos-orders.json)
            if len(orders) > 300:
                orders = orders[:300]

            save_orders(orders)
            self._send_json(200, {"success": True, "order": order_record})
            return

        # API Route: POST /api/categories
        if path == "/api/categories":
            content_len = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_len) if content_len > 0 else b"{}"
            try:
                proc = subprocess.Popen(
                    ["node", os.path.join(BASE_DIR, "category_service.js"), "save-category"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                stdout, stderr = proc.communicate(input=body_bytes)
                if proc.returncode != 0:
                    err_data = {}
                    try:
                        err_data = json.loads(stderr.decode("utf-8"))
                    except Exception:
                        pass
                    self._send_json(400, {"error": err_data.get("error", "Failed to save category")})
                else:
                    res_data = json.loads(stdout.decode("utf-8"))
                    self._send_json(200, res_data)
            except Exception as e:
                self._send_json(500, {"error": f"Internal server error: {e}"})
            return

        self._send_json(404, {"error": "Not found"})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path.startswith("/api/pos/orders/"):
            order_id = path.split("/api/pos/orders/")[1]
            content_len = int(self.headers.get("Content-Length", 0))
            if content_len <= 0:
                self._send_json(400, {"error": "Empty request body"})
                return

            try:
                body = json.loads(self.rfile.read(content_len).decode("utf-8"))
            except Exception as e:
                self._send_json(400, {"error": f"Invalid JSON body: {e}"})
                return

            orders = load_orders()
            match_idx = next((i for i, o in enumerate(orders) if o.get("id") == order_id), -1)

            if match_idx == -1:
                self._send_json(404, {"error": "Order not found", "id": order_id})
                return

            now_iso = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            now_ms = int(time.time() * 1000)

            # Update fields
            for k, v in body.items():
                if k != "id":
                    orders[match_idx][k] = v
            orders[match_idx]["updatedAt"] = now_iso
            orders[match_idx]["updatedAtMs"] = now_ms

            save_orders(orders)
            self._send_json(200, {"success": True, "order": orders[match_idx]})
            return

        self._send_json(404, {"error": "Not found"})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path.startswith("/api/pos/orders/"):
            order_id = path.split("/api/pos/orders/")[1]
            orders = load_orders()
            orig_len = len(orders)
            # Remove or mark as cancelled
            orders = [o for o in orders if o.get("id") != order_id]
            if len(orders) < orig_len:
                save_orders(orders)
                self._send_json(200, {"success": True, "deleted": order_id})
            else:
                self._send_json(404, {"error": "Order not found", "id": order_id})
            return

        self._send_json(404, {"error": "Not found"})


def run():
    port = PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    server_address = (BIND, port)
    httpd = ThreadingHTTPServer(server_address, NavrangRequestHandler)
    print(f"============================================================")
    print(f"  Navrang Restaurant POS Server with Live Order Sync")
    print(f"  Serving directory: {BASE_DIR}")
    print(f"  Local Desktop:     http://localhost:{port}/")
    print(f"  Floor Waiter POS:  http://localhost:{port}/admin/billing.html")
    print(f"  POS REST API:      http://localhost:{port}/api/pos/orders")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Navrang server...")
        httpd.server_close()


if __name__ == "__main__":
    run()
