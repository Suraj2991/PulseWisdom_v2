from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.endpoints import router as ephemeris_router

app = FastAPI(
    title="Ephemeris Service",
    description="Service for calculating astrological positions and aspects",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ephemeris_router, prefix="/api/v1/ephemeris", tags=["ephemeris"])

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"} 