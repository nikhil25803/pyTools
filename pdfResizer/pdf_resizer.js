// all the code should not be in the main function
document.querySelector('#upload-form').addEventListener("submit", async function (e) {
    e.preventDefault();
    let pyodide = await pyodideReadyPromise;
    console.log('Entered Event Listener')
    //   remove the form
    var convertable = [];
    var not_convertable = [];
    // var destination_type=document.querySelector("#destination_type").value
    var max_allowable_size_in_mb = 20;
    var inputFiles = document.querySelector("#file-field").files
    var width = document.querySelector("#width").value
    var height = document.querySelector("#height").value
    console.log(inputFiles)
    if (!validateFileSizes(inputFiles)) { return } else {/* remove the error message (html element)  or just delete the form bro */ }
    for (let i = 0; i < inputFiles.length; i++) {
        await convertToBinaryString(inputFiles[i])
    }
    console.log('all files read')
    function convertToBinaryString(file) {
        console.log("Entered convertToBinaryString Function")
        return new Promise((resolve, reject) => {
            var fr = new FileReader();
            fr.onload = () => {
                data = fr.result;
                convertable.push([file.name, data]);
                resolve(data) // what does this do
            };
            fr.onerror = () => {
                not_convertable.push(file.name);
                reject(`'${file.name}' cannot be read!`)
            }
            fr.readAsBinaryString(file);
        });
    }
    // convertable.push('d')
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
        const form = document.querySelector('#upload-form')
        form.remove()
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
    console.log(convertable)
    console.log(not_convertable)

    pyodide.globals.set("resizables", convertable)
    pyodide.globals.set("not_convertable", not_convertable)
    //   pyodide.globals.set("destination_type",destination_type)
    pyodide.globals.set("dimensions", [width, height])

    pyodide.runPython(`
    import random
    import os
    import shutil
    from io import BytesIO
    from PyPDF2 import PdfReader, PdfWriter
    import mimetypes
    print("All imports done, Pyodide is running")
    
    def main():
        global download_location, not_removed
        download_location, not_removed = pdf_resizer('pdf-resizer', resizables, dimensions)
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
        if len(resizables):
            length = len(resizables)
            for i in range(length):
                file_name, bin_str = resizables[i]
                new_width, new_height = dimensions
                bytes_obj = BytesIO(bytes(bin_str, encoding="raw_unicode_escape"))
                try:
                    reader = PdfReader(bytes_obj)
    
                    # Create a new PDF writer object
                    writer = PdfWriter()
    
                    for page_num in range(len(reader.pages)):

                        # Get the current page
                        page = reader.pages[page_num]
    
                        # Resize the page
                        page.mediabox.lower_left = (0, 0)
                        page.mediabox.upper_right = (new_width, new_height)
    
                        # Add the resized page to the PDF writer object
                        writer.add_page(page)
    
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
    
        resizables_in_dir = [f for f in os.listdir(f"{folder_name}") if f"{f}"[0].isalnum()]
        print(resizables_in_dir)
        total_files = len(resizables_in_dir)
        downloadable_location = None
        if total_files > 1:
            shutil.make_archive(f"{folder_name}", "zip", f"{folder_name}")
            shutil.rmtree(f"{folder_name}")
            downloadable_location = f"{folder_name}.zip"
        elif total_files == 1:
            downloadable_location = f"{folder_name}/{resizables_in_dir[0]}"
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

    return pyodide;
}
let pyodideReadyPromise = main();