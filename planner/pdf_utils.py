from pypdf import PdfReader


def extract_text_from_pdf_path(file_path: str) -> str:
    """
    Extract text from a PDF file path.
    """

    reader = PdfReader(file_path)

    text = ""

    for page_number, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text()

        if page_text:
            text += f"\n\n--- Page {page_number} ---\n"
            text += page_text

    return text.strip()