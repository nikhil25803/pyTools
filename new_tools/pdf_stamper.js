// all the code should not be in the main function
document.querySelector('#upload-form').addEventListener("submit", async function (e) {
    e.preventDefault();
    let pyodide = await pyodideReadyPromise;
    console.log('Entered Event Listener')
    //   remove the form
    var input_pdfs = [];
    var stamp_pdfs = [];
    var not_convertable = [];
    // var destination_type=document.querySelector("#destination_type").value
    var max_allowable_size_in_mb = 20;
    var inputFiles = document.querySelector("#file-field1").files
    var stampFiles = document.querySelector("#file-field2").files
    console.log(inputFiles)
    console.log(stampFiles)
    if (!validateFileSizes(inputFiles)) { return } else {/* remove the error message (html element)  or just delete the form bro */ }
    for (let i = 0; i < inputFiles.length; i++) {
        await convertToBinaryString(inputFiles[i], input_pdfs)
    }
    console.log('All input pfds read')

    if (!validateFileSizes(stampFiles)) { return } else {/* remove the error message (html element)  or just delete the form bro */ }
    for (let i = 0; i < stampFiles.length; i++) {
        await convertToBinaryString(stampFiles[i], stamp_pdfs)
    }
    console.log('All stamp pdfs read')

    function convertToBinaryString(file, array) {
        console.log("Entered convertToBinaryString Function")
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                data = fr.result;
                array.push([file.name, data]);
                resolve(data) // what does this do
            };
            fr.onerror = () => {
                not_convertable.push(file.name);
                reject(`'${file.name}' cannot be read!`)
            }
            fr.readAsBinaryString(file);
        });
    }

    //////////////
    function validateFileSizes(fileList) {
        const error_div = document.querySelector('#error-message')
        if (fileList.length > 10) {
            error_div.innerHTML = `You can upload only 10 files at once!`
            error_div.hidden = false;
            return 0;
        }
        for (let i = 0; i < fileList.length; i++) {
            if (fileList[i].size > (max_allowable_size_in_mb * 1048576)) {
                error_div.innerHTML = `Max upload size per file is ${max_allowable_size_in_mb}mb!`
                error_div.hidden = false;
                // do changes here
                // as in add form
                // add message
                return 0;
            }
        }
        // here should we remove the form?
        return 1;
    }
    function downloadFile(content, filename, mime_type) {
        const blob = new Blob([content.toJs()], { type: mime_type })
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        const button = document.createElement('button')
        button.type = "button";
        button.innerHTML = "Download";
        a.appendChild(button)
        document.body.appendChild(a);
        button.addEventListener('click', () => {
            console.log('clicked')
        })
        // a.click();
        // document.body.removeChild(a);
        // URL.revokeObjectURL(url);

    }
    pyodide.globals.set('downloadFile', downloadFile)
    //////////////
    // should we make inputFiles=null?
    console.log("Input PDFs: ", input_pdfs)
    console.log("Stamp PDFs: ", stamp_pdfs)
    console.log("Not Convertables: ", not_convertable)

    pyodide.globals.set("input_pdfs", input_pdfs)
    pyodide.globals.set("stamp_pdfs", stamp_pdfs)
    pyodide.globals.set("not_convertable", not_convertable)
    //   pyodide.globals.set("destination_type",destination_type)

    pyodide.runPython(`
    from pathlib import Path
    from typing import Union, Literal, List
    from PyPDF2 import PdfWriter, PdfReader
    import os
    import mimetypes
    import random
    from io import BytesIO
    import shutil
    
    
    def main():
        global download_location, not_removed
        download_location, not_removed = pdf_stamper(
            'pdf-encryptor', input_pdfs, stamp_pdfs)
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
    
    
    def pdf_stamper(folder_name, input_pdfs,stamp_pdfs):
        empty_root_folder()
        os.makedirs(f'{folder_name}')
        not_removed = []
        print(len(input_pdfs))
        if len(input_pdfs):
            length = len(input_pdfs)
            for i in range(length):
                input_file, input_bin_str = input_pdfs[i]
                stamp_file, stamp_bin_str = stamp_pdfs[i]
                input_bytes_obj = BytesIO(
                    bytes(input_bin_str, encoding="raw_unicode_escape"))
                stamp_bytes_obj = BytesIO(
                    bytes(stamp_bin_str, encoding="raw_unicode_escape"))
                try:
                    reader = PdfReader(input_bytes_obj)
                    writer = PdfWriter()
                    for index in range(len(reader.pages)):
                        content_page = reader.pages[index]
                        mediabox = content_page.mediabox
                        reader_stamp = PdfReader(stamp_bytes_obj)
                        image_page = reader_stamp.pages[0]
    
                        image_page.merge_page(content_page)
                        image_page.mediabox = mediabox
                        writer.add_page(image_page)
                    filename = input_file[::-1].split('.', maxsplit=1)[-1][::-1]
                    path_without_extension = f"{folder_name}/{filename}"
                    fuid = '' if not os.path.exists(
                        path_without_extension+".pdf") else '_'+file_uid_generator(path_without_extension, "pdf")
    
                    with open(f'{path_without_extension+fuid}.pdf', "wb") as f:
                        writer.write(f)
    
                except Exception as e:
                    print("entered exception")
                    not_removed.append(f"{input_file}")
                    print(e)
                    continue
        else:
            not_removed = [input_file for input_file,
                           input_bin_str in input_pdfs]
            print("length mismatch")
    
        convertables_in_dir = [f for f in os.listdir(
            f"{folder_name}") if f"{f}"[0].isalnum()]
        print(convertables_in_dir)
        total_files = len(convertables_in_dir)
        downloadable_location = None
        if total_files > 1:
            shutil.make_archive(f"{folder_name}", "zip", f"{folder_name}")
            shutil.rmtree(f"{folder_name}")
            downloadable_location = f"{folder_name}.zip"
        elif total_files == 1:
            downloadable_location = f"{folder_name}/{convertables_in_dir[0]}"
        else:
            shutil.rmtree(f"{folder_name}")
        print("not_converted: ", not_removed)
        return [downloadable_location, not_removed]
    
    
    main()
    
  `)
});
async function main() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('PyPDF2')
    await micropip.install('typing')

    return pyodide;
}
let pyodideReadyPromise = main();