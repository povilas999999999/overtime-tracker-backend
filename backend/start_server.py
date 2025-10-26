import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"🚀 Starting server on port {port}")
    uvicorn.run("server:app", host="0.0.0.0", port=port)
