from setuptools import setup, find_packages

setup(
    name="FinSight",
    version="1.0.0",
    description="A Stock Analysis Tool",
    author="Karan Nadar",
    packages=find_packages(),
    install_requires=[
        "pandas",
        "numpy",
        "matplotlib",
        "yfinance"
    ],
    entry_points={
        'console_scripts': [
            'finsight=main:main',
        ],
    },
)
