from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

def initialize_models():
    """Initialize and return a dictionary of classification models."""
    return {
        "GaussianNB": GaussianNB(),
        "KNN": KNeighborsClassifier(),
        "XGBClassifier": XGBClassifier(),
        "Random Forest": RandomForestClassifier(),
        "LGBMClassifier": LGBMClassifier(verbose=-1),
    }
