from setuptools import setup, find_packages

setup(
    name="finguard",
    version="2.4.0",
    description="Risk-Tiered Financial AI Governance Platform (Python Edition)",
    author="FinGuard Governance Team",
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[
        "lightgbm>=3.3.0",
        "scikit-learn>=1.0.0",
        "pandas>=1.3.0",
        "numpy>=1.20.0"
    ],
    entry_points={
        "console_scripts": [
            "finguard=cli:main",
            "finguard-server=app:main"
        ]
    }
)
