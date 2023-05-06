import random
import os
import shutil
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
import mimetypes

def main():
    global download_location, not_removed
    download_location, not_removed = pdf_resizer(
        'pdf-encryptor', resizable, dimensions)
    not_removed = not_convertable.to_py()+not_removed
    print(type(download_location), type(not_removed))
    if download_location:
        mime = mimetypes.guess_type(download_location)[0]
        print(mime)
        with open(download_location, "rb") as f:
            file_content = f.read()
        downloadFile(file_content, download_location.split('/')[-1], mime)

    def file_uid_generator(path_name, destination_type):
        charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        while True:
            fuid = ''
            for i in range(5):
                fuid += random.choice(charset)
            if not os.path.exists(f"{path_name}_{fuid}.{destination_type}"):
                return fuid

    def empty_root_folder():
        for item in os.listdir():
            if os.path.isfile(item):
                os.remove(item)
            else:
                shutil.rmtree(item)

    def pdf_resizer(folder_name, resizables, dimensions):
        empty_root_folder()
        os.makedirs(f'{folder_name}')
        not_removed = []
        print(len(resizables))
        # timer
        if len(resizables):
            length = len(resizables)
            for i in range(length):
                file_name, bin_str = resizables[i]
                new_width, new_height = dimensions[i]
                bytes_obj = BytesIO(
                    bytes(bin_str, encoding="raw_unicode_escape"))
                try:
                    reader = PdfReader(file)

                    # Create a new PDF writer object
                    writer = PdfWriter()

                    for page_num in range(reader.numPages):
                        # Get the current page
                        page = reader.getPage(page_num)

                        # Resize the page
                        page.mediaBox.lowerLeft = (0, 0)
                        page.mediaBox.upperRight = (new_width, new_height)

                        # Add the resized page to the PDF writer object
                        writer.addPage(page)

                    filename = file_name[::-1].split('.', maxsplit=1)[-1][::-1]
                    path_without_extension = f"{folder_name}/{filename}"
                    fuid = '' if not os.path.exists(
                        path_without_extension+".pdf") else '_'+file_uid_generator(path_without_extension, "pdf")

                    with open(f'{path_without_extension+fuid}.pdf', "wb") as f:
                        writer.write(f)

                except Exception as e:
                    print("entered exception")
                    not_removed.append(f"{file_name}")
                    print(e)
                    continue
        else:
            not_removed = [file_name for file_name, bin_str in resizables]
            print("length mismatch")

        resizables_in_dir = [f for f in os.listdir(
            f"{folder_name}") if f"{f}"[0].isalnum()]
        print(resizables_in_dir)
        total_resizables = len(resizables_in_dir)
        downloadable_location = None
        if total_files > 1:
            shutil.make_archive(f"{folder_name}", "zip", f"{folder_name}")
            shutil.rmtree(f"{folder_name}")
            downloadable_location = f"{folder_name}.zip"
        elif total_files == 1:
            downloadable_location = f"{folder_name}/{files_in_dir[0]}"
        else:
            shutil.rmtree(f"{folder_name}")
        print("not_converted: ", not_removed)
        return [downloadable_location, not_removed]


main()
