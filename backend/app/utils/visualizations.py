import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import numpy as np
from io import BytesIO
import base64

def generate_correlation_chart(X, y):
    """Generate correlation chart between features and target."""
    plt.figure(figsize=(8, 6), dpi=200)
    X.corrwith(y).sort_values().plot(kind='bar', color='skyblue')
    buf = BytesIO()
    plt.savefig(buf, format='png')
    plt.close()
    return base64.b64encode(buf.getvalue()).decode()

def generate_feature_distribution_plots(X, y, features):
    """Generate distribution plots for selected features."""
    plots = {}
    for feature in features:
        buf = BytesIO()
        plt.figure(figsize=(6, 4), dpi=200)
        for label in np.unique(y):
            X.loc[y == label, feature].plot.hist(alpha=0.5, label=f'Class {label}')
        plt.legend()
        plt.savefig(buf, format='png')
        plt.close()
        plots[feature] = base64.b64encode(buf.getvalue()).decode()
    return plots

def generate_confusion_matrix_plot(y_test, y_pred):
    """Generate confusion matrix visualization."""
    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(6, 6))
    cm_display = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['No Failure', 'Failure'])
    cm_display.plot(cmap='Blues', ax=ax)
    
    buf = BytesIO()
    plt.savefig(buf, format="png")
    plt.close()
    
    return base64.b64encode(buf.getvalue()).decode()
