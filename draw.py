import math
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

plt.rcParams['font.size'] = 12
plt.rcParams['figure.figsize'] = [10, 6]
plt.rcParams['axes.grid'] = True
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.alpha'] = 0.3
plt.rcParams['lines.linewidth'] = 2

eq_time = pd.to_datetime('2025-1-21 0:17:27')
eq_timestamp = int(eq_time.timestamp() * 1000)
lat = 23.23
lon = 120.57
intensity = 7
depth = 9.7
mag = 6.4

data = [
    {
        "status": 0,
        "final": 0,
        "rts": False,
        "detail": 0,
        "reason": 1,
        "trigger": 2,
        "eq": {
            "time": 1737389842000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 10,
            "mag": 1,
            "loc": "臺南市東山區",
            "max": 0
        },
        "time": 1737389853000
    },
    {
        "status": 0,
        "final": 0,
        "rts": False,
        "detail": 0,
        "reason": 3,
        "trigger": 2,
        "eq": {
            "time": 1737389842000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 10,
            "mag": 1,
            "loc": "臺南市東山區",
            "max": 3
        },
        "time": 1737389853000
    },
    {
        "status": 0,
        "final": 0,
        "rts": False,
        "detail": 1,
        "reason": 1,
        "trigger": 3,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389854000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 6,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389855000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 8,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389855000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 9,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389855000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 9,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389855000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 9,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389856000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 11,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389856000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 11,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389856000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 16,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389857000
    },
    {
        "status": 0,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 16,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 4
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 20,
        "eq": {
            "time": 1737389850000,
            "lon": 120.39,
            "lat": 23.32,
            "depth": 12,
            "mag": 4.8,
            "loc": "臺南市東山區",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 20,
        "eq": {
            "time": 1737389848000,
            "lon": 120.57,
            "lat": 23.24,
            "depth": 12,
            "mag": 5.9,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 20,
        "eq": {
            "time": 1737389848000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 14,
            "mag": 5.9,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 20,
        "eq": {
            "time": 1737389848000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 16,
            "mag": 5.9,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 20,
        "eq": {
            "time": 1737389847000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 18,
            "mag": 5.9,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 21,
        "eq": {
            "time": 1737389848000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 16,
            "mag": 5.9,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 21,
        "eq": {
            "time": 1737389847000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 5
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 21,
        "eq": {
            "time": 1737389847000,
            "lon": 120.55,
            "lat": 23.24,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389857000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 21,
        "eq": {
            "time": 1737389847000,
            "lon": 120.57,
            "lat": 23.22,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389858000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 22,
        "eq": {
            "time": 1737389847000,
            "lon": 120.57,
            "lat": 23.22,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389858000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 24,
        "eq": {
            "time": 1737389847000,
            "lon": 120.57,
            "lat": 23.22,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389858000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 25,
        "eq": {
            "time": 1737389847000,
            "lon": 120.57,
            "lat": 23.22,
            "depth": 18,
            "mag": 6,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389858000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 26,
        "eq": {
            "time": 1737389846000,
            "lon": 120.57,
            "lat": 23.24,
            "depth": 30,
            "mag": 6.3,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389859000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 26,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389859000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 26,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389859000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 26,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389859000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 26,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389859000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 28,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389860000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 28,
        "eq": {
            "time": 1737389846000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 32,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389860000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 28,
        "eq": {
            "time": 1737389848000,
            "lon": 120.53,
            "lat": 23.26,
            "depth": 42,
            "mag": 6.8,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389860000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 29,
        "eq": {
            "time": 1737389848000,
            "lon": 120.53,
            "lat": 23.26,
            "depth": 42,
            "mag": 6.8,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389861000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 29,
        "eq": {
            "time": 1737389848000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 42,
            "mag": 6.8,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389861000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 29,
        "eq": {
            "time": 1737389848000,
            "lon": 120.57,
            "lat": 23.24,
            "depth": 42,
            "mag": 6.9,
            "loc": "嘉義縣大埔鄉",
            "max": 6
        },
        "time": 1737389861000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 31,
        "eq": {
            "time": 1737389848000,
            "lon": 120.57,
            "lat": 23.24,
            "depth": 42,
            "mag": 6.9,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389861000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 32,
        "eq": {
            "time": 1737389848000,
            "lon": 120.59,
            "lat": 23.22,
            "depth": 42,
            "mag": 6.9,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389862000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 32,
        "eq": {
            "time": 1737389848000,
            "lon": 120.61,
            "lat": 23.22,
            "depth": 42,
            "mag": 7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389862000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 32,
        "eq": {
            "time": 1737389848000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 42,
            "mag": 7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389862000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 33,
        "eq": {
            "time": 1737389846000,
            "lon": 120.65,
            "lat": 23.2,
            "depth": 40,
            "mag": 7,
            "loc": "高雄市甲仙區",
            "max": 8
        },
        "time": 1737389862000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 34,
        "eq": {
            "time": 1737389846000,
            "lon": 120.65,
            "lat": 23.2,
            "depth": 40,
            "mag": 7,
            "loc": "高雄市甲仙區",
            "max": 8
        },
        "time": 1737389862000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 36,
        "eq": {
            "time": 1737389846000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 40,
            "mag": 7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 37,
        "eq": {
            "time": 1737389846000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 40,
            "mag": 7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 45,
        "eq": {
            "time": 1737389847000,
            "lon": 120.61,
            "lat": 23.22,
            "depth": 38,
            "mag": 6.9,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 46,
        "eq": {
            "time": 1737389847000,
            "lon": 120.59,
            "lat": 23.22,
            "depth": 36,
            "mag": 6.9,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 50,
        "eq": {
            "time": 1737389847000,
            "lon": 120.59,
            "lat": 23.22,
            "depth": 34,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 51,
        "eq": {
            "time": 1737389847000,
            "lon": 120.61,
            "lat": 23.22,
            "depth": 32,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389863000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 51,
        "eq": {
            "time": 1737389847000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 30,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 53,
        "eq": {
            "time": 1737389848000,
            "lon": 120.61,
            "lat": 23.22,
            "depth": 30,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 54,
        "eq": {
            "time": 1737389848000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 28,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 54,
        "eq": {
            "time": 1737389848000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 26,
            "mag": 6.8,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 54,
        "eq": {
            "time": 1737389849000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 18,
            "mag": 6.7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 55,
        "eq": {
            "time": 1737389849000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 16,
            "mag": 6.7,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389864000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 56,
        "eq": {
            "time": 1737389849000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 14,
            "mag": 6.6,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389865000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 56,
        "eq": {
            "time": 1737389849000,
            "lon": 120.63,
            "lat": 23.22,
            "depth": 10,
            "mag": 6.6,
            "loc": "臺南市南化區",
            "max": 8
        },
        "time": 1737389865000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 56,
        "eq": {
            "time": 1737389849000,
            "lon": 120.65,
            "lat": 23.24,
            "depth": 12,
            "mag": 6.6,
            "loc": "高雄市那瑪夏區",
            "max": 8
        },
        "time": 1737389865000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 58,
        "eq": {
            "time": 1737389849000,
            "lon": 120.65,
            "lat": 23.24,
            "depth": 20,
            "mag": 6.8,
            "loc": "高雄市那瑪夏區",
            "max": 8
        },
        "time": 1737389865000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 59,
        "eq": {
            "time": 1737389849000,
            "lon": 120.65,
            "lat": 23.24,
            "depth": 12,
            "mag": 6.7,
            "loc": "高雄市那瑪夏區",
            "max": 8
        },
        "time": 1737389866000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 59,
        "eq": {
            "time": 1737389849000,
            "lon": 120.65,
            "lat": 23.24,
            "depth": 10,
            "mag": 6.7,
            "loc": "高雄市那瑪夏區",
            "max": 8
        },
        "time": 1737389866000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 62,
        "eq": {
            "time": 1737389849000,
            "lon": 120.65,
            "lat": 23.24,
            "depth": 10,
            "mag": 6.7,
            "loc": "高雄市那瑪夏區",
            "max": 8
        },
        "time": 1737389866000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 62,
        "eq": {
            "time": 1737389851000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389866000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 2,
        "trigger": 62,
        "eq": {
            "time": 1737389851000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 10,
            "mag": 6.5,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389866000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 66,
        "eq": {
            "time": 1737389851000,
            "lon": 120.55,
            "lat": 23.26,
            "depth": 10,
            "mag": 6.5,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389868000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 1,
        "trigger": 68,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389868000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 77,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389870000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 78,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389870000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 79,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389874000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 79,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389874000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 81,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389875000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 81,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389875000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 82,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389878000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389879000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389880000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389880000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389881000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389881000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 83,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389882000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 84,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389882000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 84,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389882000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 88,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389883000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 88,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389884000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 88,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389884000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 89,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389885000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 93,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389887000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 93,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389888000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 95,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389891000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 100,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389893000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 106,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389898000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 107,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389898000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 108,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389898000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 109,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389899000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 118,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389908000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 118,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389908000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 118,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389908000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 123,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389910000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 125,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389910000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 125,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389910000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 125,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389911000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 126,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389911000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 128,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389912000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 128,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389913000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 128,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389913000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 129,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389913000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 129,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389914000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 131,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389915000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 133,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389916000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 133,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389917000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 133,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389917000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 133,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389917000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 133,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389918000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 134,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389919000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 134,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389920000
    },
    {
        "status": 1,
        "final": 0,
        "rts": True,
        "detail": 1,
        "reason": 3,
        "trigger": 137,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389922000
    },
    {
        "status": 1,
        "final": 1,
        "rts": True,
        "detail": 1,
        "reason": 4,
        "trigger": 137,
        "eq": {
            "time": 1737389851000,
            "lon": 120.53,
            "lat": 23.28,
            "depth": 10,
            "mag": 6.4,
            "loc": "嘉義縣大埔鄉",
            "max": 8
        },
        "time": 1737389927000
    }
]

df = pd.DataFrame([{
    'time': d['time'],
    'lat': d['eq']['lat'],
    'lon': d['eq']['lon'],
    'depth': d['eq']['depth'],
    'mag': d['eq']['mag'],
    'max': d['eq']['max'],
    'trigger': d['trigger']
} for d in data])

ref_time_ms = int(datetime(2025, 1, 21, 0, 17, 27).timestamp() * 1000)

df['time_after_earthquake'] = (df['time'] - ref_time_ms) / 1000

plt.figure()
plt.axhline(y=mag, color='#DC2626', linestyle='--', label='CWA Report')
plt.plot(df['time_after_earthquake'], df['mag'],
         linestyle='-', label='TREM EEW', color='#2563EB',
         marker='o', markersize=4, markeredgecolor='white')
plt.title('Magnitude', pad=15)
plt.xlabel('t(s)', labelpad=10)
plt.ylabel('M', labelpad=10)
plt.legend(frameon=True, fancybox=True, shadow=True)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('magnitude.png', bbox_inches='tight', dpi=300,
            facecolor='white', edgecolor='none')
plt.close()

plt.figure()
plt.axhline(y=intensity, color='#DC2626', linestyle='--', label='CWA Report')
plt.plot(df['time_after_earthquake'], df['max'],
         linestyle='-', label='TREM EEW', color='#2563EB',
         marker='o', markersize=4, markeredgecolor='white')
plt.title('Intensity', pad=15)
plt.xlabel('t(s)', labelpad=10)
plt.ylabel('SI', labelpad=10)
plt.legend(frameon=True, fancybox=True, shadow=True)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('intensity.png', bbox_inches='tight', dpi=300,
            facecolor='white', edgecolor='none')
plt.close()

plt.figure()
plt.axhline(y=depth, color='#DC2626', linestyle='--', label='CWA Report')
plt.plot(df['time_after_earthquake'], df['depth'],
         linestyle='-', label='TREM EEW', color='#2563EB',
         marker='o', markersize=4, markeredgecolor='white')
plt.title('Depth', pad=15)
plt.xlabel('t(s)', labelpad=10)
plt.ylabel('△(km)', labelpad=10)
plt.legend(frameon=True, fancybox=True, shadow=True)
plt.grid(True, linestyle='--', alpha=0.7)
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('depth.png', bbox_inches='tight', dpi=300,
            facecolor='white', edgecolor='none')
plt.close()

plt.figure()
plt.plot(df['time_after_earthquake'], df['trigger'],
         linestyle='-', label='TREM EEW', color='#2563EB',
         marker='o', markersize=4, markeredgecolor='white')
plt.title('Triggered', pad=15)
plt.xlabel('t(s)', labelpad=10)
plt.ylabel('stations', labelpad=10)
plt.legend(frameon=True, fancybox=True, shadow=True)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('triggered.png', bbox_inches='tight', dpi=300,
            facecolor='white', edgecolor='none')
plt.close()


def distance(latA, lngA, latB, lngB):
    latA, lngA, latB, lngB = map(math.radians, [latA, lngA, latB, lngB])
    sin_latA, sin_latB = map(math.sin, [math.atan(
        math.tan(latA)), math.atan(math.tan(latB))])
    cos_latA, cos_latB = map(math.cos, [math.atan(
        math.tan(latA)), math.atan(math.tan(latB))])
    angle_distance = math.acos(
        sin_latA * sin_latB + cos_latA * cos_latB * math.cos(lngA - lngB))
    return angle_distance * 6371.008


df['distance_to_ref'] = df.apply(lambda row: distance(
    row['lat'], row['lon'], lat, lon), axis=1)

plt.figure(facecolor='white', edgecolor='none')
plt.plot(df['time_after_earthquake'], df['distance_to_ref'],
         color='blue', linestyle='-', label='TREM EEW')
plt.title('Location Error', fontsize=14, pad=10)
plt.xlabel('t(s)')
plt.ylabel('△(km)')
plt.legend()
plt.grid(True)
plt.gca()
plt.savefig('location.png', bbox_inches='tight', dpi=300,
            facecolor='white', edgecolor='none')
plt.close()

# 新增一個大圖，包含所有圖表，並共用 X 軸
fig, axes = plt.subplots(5, 1, figsize=(
    10, 25), sharex=True, facecolor='white')

# Magnitude 子圖
axes[0].axhline(y=mag, color='#DC2626', linestyle='--', label='CWA Report')
axes[0].plot(df['time_after_earthquake'], df['mag'], linestyle='-', label='TREM EEW',
             color='#2563EB', marker='o', markersize=4, markeredgecolor='white')
axes[0].set_title('Magnitude', pad=15)
axes[0].set_ylabel('M', labelpad=10)
axes[0].legend(frameon=True, fancybox=True, shadow=True)
axes[0].grid(True, linestyle='--', alpha=0.7)

# Intensity 子圖
axes[1].axhline(y=intensity, color='#DC2626',
                linestyle='--', label='CWA Report')
axes[1].plot(df['time_after_earthquake'], df['max'], linestyle='-', label='TREM EEW',
             color='#2563EB', marker='o', markersize=4, markeredgecolor='white')
axes[1].set_title('Intensity', pad=15)
axes[1].set_ylabel('SI', labelpad=10)
axes[1].legend(frameon=True, fancybox=True, shadow=True)
axes[1].grid(True, linestyle='--', alpha=0.7)

# Depth 子圖
axes[2].axhline(y=depth, color='#DC2626', linestyle='--', label='CWA Report')
axes[2].plot(df['time_after_earthquake'], df['depth'], linestyle='-', label='TREM EEW',
             color='#2563EB', marker='o', markersize=4, markeredgecolor='white')
axes[2].set_title('Depth', pad=15)
axes[2].set_ylabel('△(km)', labelpad=10)
axes[2].invert_yaxis()
axes[2].legend(frameon=True, fancybox=True, shadow=True)
axes[2].grid(True, linestyle='--', alpha=0.7)

# Triggered 子圖
axes[3].plot(df['time_after_earthquake'], df['trigger'], linestyle='-', label='TREM EEW',
             color='#2563EB', marker='o', markersize=4, markeredgecolor='white')
axes[3].set_title('Triggered', pad=15)
axes[3].set_ylabel('Stations', labelpad=10)
axes[3].legend(frameon=True, fancybox=True, shadow=True)
axes[3].grid(True, linestyle='--', alpha=0.7)

# Location Error 子圖
axes[4].plot(df['time_after_earthquake'], df['distance_to_ref'], linestyle='-', label='TREM EEW',
             color='#2563EB', marker='o', markersize=4, markeredgecolor='white')
axes[4].set_title('Location Error', pad=15)
axes[4].set_xlabel('t(s)', labelpad=10)
axes[4].set_ylabel('△(km)', labelpad=10)
axes[4].legend(frameon=True, fancybox=True, shadow=True)
axes[4].grid(True, linestyle='--', alpha=0.7)

# 調整整體佈局並儲存
plt.tight_layout()
plt.savefig('combined_chart.png', dpi=300,
            bbox_inches='tight', facecolor='white')
plt.show()
