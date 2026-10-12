from finsight.data_loader import DataLoader

def test_invalid_ticker():
    loader = DataLoader()
    data = loader.fetch_stock("INVALID123", "2023-01-01", "2023-02-01")
    assert data is None
