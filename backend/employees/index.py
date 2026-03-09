import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p86624306_task_monitoring_inte")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """CRUD для сотрудников"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    path_params = event.get("pathParameters") or {}
    emp_id = path_params.get("id")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            cur.execute(f"SELECT id, name, short_name, position, department, email FROM {SCHEMA}.employees WHERE name != '__deleted__' ORDER BY id")
            rows = cur.fetchall()
            employees = [
                {"id": r[0], "name": r[1], "shortName": r[2], "position": r[3], "department": r[4], "email": r[5]}
                for r in rows
            ]
            return {"statusCode": 200, "headers": headers, "body": json.dumps(employees, ensure_ascii=False)}

        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            cur.execute(
                f"INSERT INTO {SCHEMA}.employees (name, short_name, position, department, email) VALUES (%s,%s,%s,%s,%s) RETURNING id",
                (body["name"], body["shortName"], body["position"], body["department"], body.get("email", ""))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            emp = {"id": new_id, "name": body["name"], "shortName": body["shortName"],
                   "position": body["position"], "department": body["department"], "email": body.get("email", "")}
            return {"statusCode": 201, "headers": headers, "body": json.dumps(emp, ensure_ascii=False)}

        elif method == "DELETE" and emp_id:
            cur.execute(f"SELECT short_name FROM {SCHEMA}.employees WHERE id=%s", (int(emp_id),))
            row = cur.fetchone()
            if row:
                short_name = row[0]
                cur.execute(
                    f"UPDATE {SCHEMA}.task_responsible SET employee_short_name='__removed__' WHERE employee_short_name=%s",
                    (short_name,)
                )
                cur.execute(f"UPDATE {SCHEMA}.employees SET name='__deleted__' WHERE id=%s", (int(emp_id),))
                conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        cur.close()
        conn.close()