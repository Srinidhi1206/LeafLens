from pathlib import Path
import subprocess
import sys

COMPETITION = "plant-pathology-2021-fgvc8"
OUTPUT_DIR = Path("data") / COMPETITION

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable, "-m", "kaggle", "competitions", "download",
        "-c", COMPETITION, "-p", str(OUTPUT_DIR)
    ]
    print("Downloading through your Kaggle account...")
    result = subprocess.run(command)
    if result.returncode != 0:
        print(
            "\nDownload failed. Check that kaggle.json is configured and that "
            "you have accepted the competition rules on Kaggle.",
            file=sys.stderr,
        )
        raise SystemExit(result.returncode)

    archives = list(OUTPUT_DIR.glob("*.zip"))
    if not archives:
        print(f"Download completed, but no ZIP archive was found in {OUTPUT_DIR}.")
        return

    import zipfile
    for archive in archives:
        print(f"Extracting {archive.name}...")
        with zipfile.ZipFile(archive) as zf:
            zf.extractall(OUTPUT_DIR)
    print(f"Dataset files are in: {OUTPUT_DIR.resolve()}")

if __name__ == "__main__":
    main()
