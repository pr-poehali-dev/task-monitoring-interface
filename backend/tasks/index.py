import json
import os
import psycopg2

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p86624306_task_monitoring_inte")

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def fetch_tasks(cur):
    cur.execute(f"""
        SELECT t.id, t.number, t.title, t.description, t.assigned_by,
               t.deadline::text, t.status, t.priority, t.section, t.linked_order_id,
               COALESCE(array_agg(tr.employee_short_name) FILTER (WHERE tr.employee_short_name IS NOT NULL AND tr.employee_short_name != '__removed__'), ARRAY[]::text[]) as responsible
        FROM {SCHEMA}.tasks t
        LEFT JOIN {SCHEMA}.task_responsible tr ON tr.task_id = t.id
        GROUP BY t.id
        ORDER BY t.id
    """)
    rows = cur.fetchall()
    return [
        {
            "id": r[0], "number": r[1], "title": r[2], "description": r[3],
            "assignedBy": r[4], "deadline": r[5], "status": r[6],
            "priority": r[7], "section": r[8],
            "linkedOrderId": r[9],
            "responsible": list(r[10]),
            "comments": []
        }
        for r in rows
    ]

def handler(event: dict, context) -> dict:
    """CRUD для задач (указания и отчёты)"""
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
    task_id = path_params.get("id")

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == "GET":
            tasks = fetch_tasks(cur)

            cur.execute(f"SELECT id, task_id, author, text, date FROM {SCHEMA}.comments ORDER BY created_at")
            comments_rows = cur.fetchall()
            comments_map = {}
            for c in comments_rows:
                tid = c[1]
                if tid not in comments_map:
                    comments_map[tid] = []
                comments_map[tid].append({"id": c[0], "author": c[2], "text": c[3], "date": c[4]})

            for t in tasks:
                t["comments"] = comments_map.get(t["id"], [])

            return {"statusCode": 200, "headers": headers, "body": json.dumps(tasks, ensure_ascii=False)}

        elif method == "POST":
            body = json.loads(event.get("body") or "{}")
            linked_order_id = body.get("linkedOrderId")
            cur.execute(
                f"INSERT INTO {SCHEMA}.tasks (number, title, description, assigned_by, deadline, status, priority, section, linked_order_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (body["number"], body["title"], body.get("description", ""), body.get("assignedBy", ""),
                 body["deadline"], body.get("status", "new"), body.get("priority", "medium"),
                 body["section"], linked_order_id)
            )
            new_id = cur.fetchone()[0]

            responsible = body.get("responsible", [])
            for name in responsible:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.task_responsible (task_id, employee_short_name) VALUES (%s,%s) ON CONFLICT DO NOTHING",
                    (new_id, name)
                )

            conn.commit()
            return {"statusCode": 201, "headers": headers, "body": json.dumps({"id": new_id}, ensure_ascii=False)}

        elif method == "PUT" and task_id:
            body = json.loads(event.get("body") or "{}")
            tid = int(task_id)

            if "status" in body and len(body) <= 2:
                cur.execute(f"UPDATE {SCHEMA}.tasks SET status=%s WHERE id=%s", (body["status"], tid))
            else:
                linked_order_id = body.get("linkedOrderId")
                cur.execute(
                    f"UPDATE {SCHEMA}.tasks SET title=%s, description=%s, assigned_by=%s, deadline=%s, priority=%s, linked_order_id=%s WHERE id=%s",
                    (body["title"], body.get("description", ""), body.get("assignedBy", ""),
                     body["deadline"], body["priority"], linked_order_id, tid)
                )
                cur.execute(f"UPDATE {SCHEMA}.task_responsible SET employee_short_name='__removed__' WHERE task_id=%s", (tid,))
                for name in body.get("responsible", []):
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.task_responsible (task_id, employee_short_name) VALUES (%s,%s) ON CONFLICT (task_id, employee_short_name) DO UPDATE SET employee_short_name=%s",
                        (tid, name, name)
                    )

            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        elif method == "DELETE" and task_id:
            tid = int(task_id)
            cur.execute(f"UPDATE {SCHEMA}.task_responsible SET employee_short_name='__removed__' WHERE task_id=%s", (tid,))
            cur.execute(f"UPDATE {SCHEMA}.tasks SET title='__deleted__' WHERE id=%s", (tid,))
            conn.commit()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

        return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
    finally:
        cur.close()
        conn.close()
