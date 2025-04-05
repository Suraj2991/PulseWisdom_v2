# Ephemeris Service

This service provides accurate astrological calculations using the Kerykeion library. It calculates birth charts, transits, aspects, and other astrological data.

## Features

- Birth chart calculations
- House system calculations
- Aspect calculations
- Transit calculations
- Fixed star positions
- Lunar phases
- Significant astrological events

## Prerequisites

- Python 3.11 or higher
- Docker (optional)

## Installation

### Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the service:
```bash
uvicorn app.main:app --reload
```

### Docker

1. Build and run using docker-compose:
```bash
docker-compose up --build
```

## API Endpoints

### Birth Chart
- `POST /api/v1/ephemeris/birth-chart`
  - Calculate a complete birth chart
  - Parameters: datetime, location, house_system

### Houses
- `POST /api/v1/ephemeris/houses`
  - Calculate house cusps
  - Parameters: datetime, location, house_system

### Aspects
- `POST /api/v1/ephemeris/aspects`
  - Calculate aspects between celestial bodies
  - Parameters: bodies

### Transits
- `POST /api/v1/ephemeris/transits`
  - Calculate transits for a date range
  - Parameters: natal_chart, date_range

### Significant Events
- `POST /api/v1/ephemeris/significant-events`
  - Calculate significant astrological events
  - Parameters: date_range

### Fixed Stars
- `POST /api/v1/ephemeris/fixed-stars`
  - Calculate fixed star positions
  - Parameters: datetime

### Lunar Phases
- `POST /api/v1/ephemeris/lunar-phases`
  - Calculate lunar phases
  - Parameters: date_range

## Testing

Run tests using pytest:
```bash
pytest
```

## Development

### Project Structure
```
ephemeris-service/
├── app/
│   ├── api/
│   │   └── endpoints.py
│   ├── models/
│   │   └── astronomical.py
│   ├── services/
│   │   └── kerykeion_service.py
│   └── main.py
├── tests/
│   ├── test_api.py
│   └── test_kerykeion_service.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

### Adding New Features

1. Add new models in `app/models/astronomical.py`
2. Implement calculations in `app/services/kerykeion_service.py`
3. Add endpoints in `app/api/endpoints.py`
4. Write tests in `tests/test_api.py`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 