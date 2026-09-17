from pathlib import Path

import joblib
import pandas as pd

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = (
    BASE_DIR
    / "dataset"
    / "Customer_Message_Dataset.csv"
)

MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = (
    MODEL_DIR
    / "message_classifier.joblib"
)


def load_dataset():
    df = pd.read_csv(DATASET_PATH)

    required_columns = {"message", "category"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            "Dataset must contain message and category columns."
        )

    # Only labelled rows are used for training.
    labelled_df = df.dropna(
        subset=["message", "category"]
    ).copy()

    labelled_df["message"] = (
        labelled_df["message"]
        .astype(str)
        .str.strip()
    )

    labelled_df["category"] = (
        labelled_df["category"]
        .astype(str)
        .str.strip()
    )

    labelled_df = labelled_df[
        (labelled_df["message"] != "")
        & (labelled_df["category"] != "")
    ]

    return labelled_df


def main():
    print("\nSmartOrder AI - Model Training")
    print("=" * 40)

    df = load_dataset()

    print(f"Labelled samples: {len(df)}")
    print(f"Categories: {df['category'].nunique()}")

    print("\nCategory distribution:")
    print(df["category"].value_counts())

    X = df["message"]
    y = df["category"]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y,
        )
    )

    pipeline = Pipeline(
        [
            (
                "tfidf",
                TfidfVectorizer(
                    lowercase=True,
                    ngram_range=(1, 2),
                    min_df=1,
                    sublinear_tf=True,
                ),
            ),
            (
                "classifier",
                LogisticRegression(
                    max_iter=1500,
                    random_state=42,
                ),
            ),
        ]
    )

    print("\nTraining model...")

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions,
    )

    print(
        f"\nTest accuracy: {accuracy:.2%}"
    )

    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0,
        )
    )

    # After evaluation, train the final model
    # using all labelled examples.
    print(
        "\nTraining final model on all "
        "labelled examples..."
    )

    pipeline.fit(X, y)

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    joblib.dump(
        pipeline,
        MODEL_PATH,
    )

    print(
        f"\nModel saved to:\n{MODEL_PATH}"
    )

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()