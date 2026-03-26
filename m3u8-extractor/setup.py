"""
Setup script for M3U8 Extractor
Install with: pip install -e .
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read README for long description
this_directory = Path(__file__).parent
long_description = (this_directory / "README.md").read_text(encoding="utf-8")

setup(
    name="m3u8-extractor",
    version="1.0.0",
    author="Creative Design Uz Team",
    author_email="info@creativedesignuz.com",
    description="Advanced M3U8 URL extractor with anti-bot bypass",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/creativedesignuz/m3u8-extractor",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Multimedia :: Video",
        "Topic :: Internet :: WWW/HTTP :: Browsers",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires=">=3.8",
    install_requires=[
        "playwright>=1.40.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
        "stealth": [
            "playwright-stealth>=0.0.1",
        ],
    },
    entry_points={
        "console_scripts": [
            "m3u8-extractor=extractor:main",
        ],
    },
    keywords="m3u8 extractor playwright video download streaming hls",
    project_urls={
        "Documentation": "https://github.com/creativedesignuz/m3u8-extractor#readme",
        "Source": "https://github.com/creativedesignuz/m3u8-extractor",
        "Tracker": "https://github.com/creativedesignuz/m3u8-extractor/issues",
    },
)
