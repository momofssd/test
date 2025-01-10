import pandas as pd
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import (
    SMOTE, ADASYN, BorderlineSMOTE, SVMSMOTE, RandomOverSampler
)

def preprocess_classification(df, pCase, nCase, targetColumn, droppedColumns):
    """Preprocess data for classification tasks."""
    # Drop specified columns
    if droppedColumns:
        df = df.drop(columns=droppedColumns, errors='ignore')

    # Separate feature columns and exclude the target column
    feature_columns = df.drop(columns=[targetColumn], errors='ignore')

    # Preprocess numeric features
    for col in feature_columns.select_dtypes(include='number'):
        df[col] = df[col].fillna(df[col].median())

    # Preprocess categorical features
    for col in feature_columns.select_dtypes(include='object'):
        df[col] = pd.factorize(df[col])[0]

    # Process target column
    df[targetColumn] = df[targetColumn].apply(
        lambda x: 1 if x == pCase else 0 if x == nCase else x
    )

    return df

def get_sampler(sampling_method):
    """Get the appropriate sampling strategy."""
    samplers = {
        "SMOTE": SMOTE,
        "ADASYN": ADASYN,
        "BorderlineSMOTE": BorderlineSMOTE,
        "SVMSMOTE": SVMSMOTE,
        "RandomOverSampler": RandomOverSampler
    }
    return samplers.get(sampling_method, SMOTE)
