import pandas as pd

def load_data(file):
    """Load CSV or Excel file into a pandas DataFrame."""
    if file.filename.endswith(('.csv', '.data')):
        data = pd.read_csv(file, header=None)
    elif file.filename.endswith(('.xls', '.xlsx')):
        data = pd.read_excel(file, header=None)
    else:
        raise ValueError("Unsupported file format")

    # Determine if first row is header
    first_row = data.iloc[0]
    if all(isinstance(val, str) for val in first_row):
        data.columns = first_row
        data = data[1:]
    else:
        data.columns = [f"Feature_{i}" for i in range(data.shape[1])]
    
    return data

def data_overall(X, y):
    """Calculate data distribution statistics."""
    counts = y.value_counts().to_dict()
    total = len(y)
    binary_ratio = {k: {"count": v, "ratio": v / total} for k, v in counts.items()}
    data_shape = (X.shape, y.shape)
    return binary_ratio, data_shape

def select_features_corr(X, y, fColCount):
    """Select top features based on correlation."""
    correlation_scores = X.corrwith(y)
    top_features = correlation_scores.abs().nlargest(fColCount).index.tolist()
    metrics = [{"feature": f, "score": correlation_scores[f]} for f in top_features]
    return top_features, metrics
