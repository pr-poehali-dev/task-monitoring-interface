import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p86624306_task_monitoring_inte")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event: dict, context) -> dict:
    """Добавление комментариев к задачам"""
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            cur.execute(
                f"INSERT INTO {SCHEMA}.comments (task_id, author, text, date) VALUES (%s,%s,%s,%s) RETURNING id",
                (body["taskId"], body["author"], body["text"], body["date"])
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            comment = {"id": new_id, "author": body["author"], "text": body["text"], "date": body["date"]}
            return {"statusCode": 201, "headers": headers, "body": json.dumps(comment, ensure_ascii=False)}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        cur.close()
        conn.close()
