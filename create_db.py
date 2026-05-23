import psycopg2
from psycopg2 import sql

def create_db():
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='priyam@123',
            host='localhost',
            port='5432'
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'pharmacy_db'")
        exists = cur.fetchone()
        if not exists:
            cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier('pharmacy_db')))
            print("Database 'pharmacy_db' created successfully.")
        else:
            print("Database 'pharmacy_db' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_db()
