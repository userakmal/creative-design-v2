"""
Test Suite for M3U8 Extractor
==============================
Run tests to verify the extractor works correctly.
"""

import asyncio
import pytest
from extractor import (
    M3U8Extractor,
    ExtractorConfig,
    ExtractionResult,
    UserAgentRotator,
    StealthUtils,
    get_m3u8_url,
    get_all_m3u8_urls,
)


# ============================================================================
# UNIT TESTS
# ============================================================================

class TestUserAgentRotator:
    """Test user agent rotation"""
    
    def test_get_random_returns_string(self):
        ua = UserAgentRotator.get_random()
        assert isinstance(ua, str)
        assert ua.startswith("Mozilla/5.0")
    
    def test_get_modern_chrome_returns_chrome(self):
        ua = UserAgentRotator.get_modern_chrome()
        assert "Chrome" in ua
    
    def test_rotation_works(self):
        """Multiple calls should return different agents"""
        agents = [UserAgentRotator.get_random() for _ in range(10)]
        # Should have at least 2 different agents
        assert len(set(agents)) >= 2


class TestExtractorConfig:
    """Test configuration"""
    
    def test_default_config(self):
        config = ExtractorConfig()
        assert config.headless is True
        assert config.stealth_mode is True
        assert config.max_retries == 3
    
    def test_custom_config(self):
        config = ExtractorConfig(
            headless=False,
            max_retries=5,
            extraction_timeout=30000,
        )
        assert config.headless is False
        assert config.max_retries == 5
        assert config.extraction_timeout == 30000


class TestExtractionResult:
    """Test result dataclass"""
    
    def test_success_result(self):
        result = ExtractionResult.success_result(
            m3u8_url="https://example.com/master.m3u8",
            page_title="Test Video",
        )
        
        assert result.success is True
        assert result.m3u8_url == "https://example.com/master.m3u8"
        assert result.error_message is None
    
    def test_error_result(self):
        result = ExtractionResult.error_result(
            error_message="Test error",
        )
        
        assert result.success is False
        assert result.error_message == "Test error"
        assert result.m3u8_url is None


# ============================================================================
# INTEGRATION TESTS
# ============================================================================

class TestM3U8Extractor:
    """Test main extractor class"""
    
    @pytest.mark.asyncio
    async def test_extractor_initialization(self):
        """Test extractor creates successfully"""
        config = ExtractorConfig(headless=True)
        extractor = M3U8Extractor(config)
        
        assert extractor.config == config
        assert extractor.logger is not None
    
    @pytest.mark.asyncio
    async def test_browser_lifecycle(self):
        """Test browser creates and closes properly"""
        config = ExtractorConfig(headless=True)
        extractor = M3U8Extractor(config)
        
        async with extractor._create_browser() as (browser, context):
            assert browser is not None
            assert context is not None
        
        # Should be closed after context exit
        assert browser.is_connected() is False
    
    @pytest.mark.asyncio
    async def test_m3u8_detection(self):
        """Test M3U8 URL detection"""
        config = ExtractorConfig(headless=True)
        extractor = M3U8Extractor(config)
        
        # Test URL patterns
        assert extractor._is_m3u8_url("https://example.com/video.m3u8") is True
        assert extractor._is_m3u8_url("https://example.com/video.m3u8?token=abc") is True
        assert extractor._is_m3u8_url("https://example.com/video.mp4") is False
        
        # Test content type
        assert extractor._is_m3u8_url("", "application/vnd.apple.mpegurl") is True
        assert extractor._is_m3u8_url("", "application/x-mpegurl") is True
    
    @pytest.mark.asyncio
    async def test_url_filtering(self):
        """Test URL filtering (ads, analytics, etc.)"""
        config = ExtractorConfig(headless=True)
        extractor = M3U8Extractor(config)
        
        # Should capture
        assert extractor._should_capture_url("https://example.com/video.m3u8") is True
        assert extractor._should_capture_url("https://cdn.example.com/stream.m3u8") is True
        
        # Should skip
        assert extractor._should_capture_url("data:text/plain,hello") is False
        assert extractor._should_capture_url("https://example.com/ads/video.m3u8") is False
        assert extractor._should_capture_url("blob:https://example.com/abc123") is False


# ============================================================================
# END-TO-END TESTS (Require Internet)
# ============================================================================

class TestEndToEnd:
    """End-to-end tests with real URLs"""
    
    @pytest.mark.asyncio
    async def test_get_m3u8_url_function(self):
        """Test convenience function"""
        # Use a known test URL that has M3U8
        test_url = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        
        # This should work (direct M3U8 URL)
        result = await M3U8Extractor(ExtractorConfig(headless=True)).extract(test_url)
        
        # Should find the URL (it's direct)
        assert result.success is True
        assert "x36xhzz.m3u8" in result.m3u8_url
    
    @pytest.mark.asyncio
    async def test_get_all_m3u8_urls(self):
        """Test getting all M3U8 URLs"""
        test_url = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
        
        urls = await get_all_m3u8_urls(test_url, headless=True, timeout=10000)
        
        # Should find at least the direct URL
        assert len(urls) >= 1
    
    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling for invalid URLs"""
        invalid_url = "https://this-domain-definitely-does-not-exist-12345.com"
        
        result = await M3U8Extractor(
            ExtractorConfig(headless=True, max_retries=0)
        ).extract(invalid_url)
        
        assert result.success is False
        assert result.error_message is not None
    
    @pytest.mark.asyncio
    async def test_timeout_handling(self):
        """Test timeout doesn't hang"""
        import time
        
        config = ExtractorConfig(
            headless=True,
            extraction_timeout=5000,  # 5 second timeout
            max_retries=0,
        )
        
        extractor = M3U8Extractor(config)
        
        start = time.time()
        result = await extractor.extract("https://httpbin.org/delay/10")  # 10s delay
        elapsed = time.time() - start
        
        # Should timeout around 5 seconds, not wait full 10
        assert elapsed < 8.0
        assert result.success is False
        assert "timeout" in result.error_message.lower()


# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

class TestPerformance:
    """Performance and resource tests"""
    
    @pytest.mark.asyncio
    async def test_no_zombie_processes(self):
        """Test that browser processes are cleaned up"""
        import subprocess
        import os
        
        # Get initial Chrome/Chromium process count
        def count_chrome_processes():
            try:
                if os.name == 'nt':  # Windows
                    result = subprocess.run(
                        ['tasklist', '/FI', 'IMAGENAME eq chrome*'],
                        capture_output=True,
                        text=True
                    )
                    return result.stdout.count('chrome')
                else:  # Linux/Mac
                    result = subprocess.run(
                        ['pgrep', '-c', 'chrome'],
                        capture_output=True,
                        text=True
                    )
                    return int(result.stdout.strip())
            except:
                return 0
        
        initial_count = count_chrome_processes()
        
        # Run extraction
        config = ExtractorConfig(headless=True, max_retries=0)
        extractor = M3U8Extractor(config)
        
        try:
            await extractor.extract("https://httpbin.org/html")
        except:
            pass  # May fail, that's ok
        
        # Give processes time to clean up
        await asyncio.sleep(1.0)
        
        final_count = count_chrome_processes()
        
        # Should not have leaked processes (allow 1-2 for tolerance)
        assert final_count <= initial_count + 2


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    # Run with pytest
    pytest.main([
        __file__,
        "-v",           # Verbose output
        "--tb=short",   # Shorter tracebacks
        "-m", "not slow",  # Skip slow tests by default
    ])
