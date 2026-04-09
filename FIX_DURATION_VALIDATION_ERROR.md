# 🔧 FIX: Duration Validation Error

**Date:** April 9, 2026  
**Issue:** Pydantic validation error when extracting video info  
**Status:** ✅ **FIXED**

---

## ❌ ERROR

```
Failed to extract: 1 validation error for ExtractResponse
duration
  Input should be a valid integer, got a number with a fractional part
  [type=int_from_float, input_value=18.875999450683594, input_type=float]
```

## 🔍 ROOT CAUSE

The `ExtractResponse` Pydantic model in `api.py` defined `duration` as `Optional[int]`, but yt-dlp returns duration as a **float** value (e.g., `18.875999450683594` seconds).

Pydantic v2 strict validation rejected the float-to-int conversion.

## ✅ FIX

Changed `duration` type from `Optional[int]` to `Optional[float]` in the `ExtractResponse` model.

### File: `telegram-video-bot/api.py`

**Before:**
```python
class ExtractResponse(BaseModel):
    success: bool
    title: str
    thumbnail: Optional[str]
    duration: Optional[int]  # ❌ Rejected float values
    duration_formatted: str
    uploader: Optional[str]
    formats: List[FormatInfo]
    is_live: bool = False
```

**After:**
```python
class ExtractResponse(BaseModel):
    success: bool
    title: str
    thumbnail: Optional[str]
    duration: Optional[float]  # ✅ Accepts float values from yt-dlp
    duration_formatted: str
    uploader: Optional[str]
    formats: List[FormatInfo]
    is_live: bool = False
```

## 🧪 VERIFICATION

The `format_duration()` utility function in `utils.py` already handles float values correctly:

```python
def format_duration(seconds) -> str:
    if seconds is None:
        return "Unknown"
    
    # Convert to int if float (yt-dlp can return float duration)
    seconds = int(float(seconds))  # ✅ Already handles floats
    
    # ... rest of formatting
```

## 📋 TEST

1. Video API restarted successfully
2. Health check passed: `http://localhost:8000/api/health`
3. Extract endpoint now accepts float durations without errors

**Test Command:**
```bash
curl -X POST http://localhost:8000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=..."}'
```

## ✅ STATUS

- [x] Type changed from `int` to `float`
- [x] API server restarted
- [x] Health check passed
- [x] Extract endpoint working
- [x] Duration formatting still correct

---

**Result:** Video extraction now works with all video types, including those with fractional duration values from yt-dlp.
