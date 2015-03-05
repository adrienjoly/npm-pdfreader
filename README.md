# pdfreader
NPM module for simplifying the development of scripted / rule-based parsing of PDF files, including tabular data (tables, with automatic column detection).

The PdfReader class reads a PDF file, and calls a function on each item found while parsing that file.

 An item object can match one of the following objects:

 - `null`, when the parsing is over, or an error occured.
 - `{file:{path:string}}`, when a PDF file is being opened.
 - `{page:integer}`, when a new page is being parsed, provides the page number, starting at 1.
 - `{text:string, x:float, y:float, w:float, h:float...}`, represents each text with its position.


    new PdfReader().parseFileItems("sample.pdf", function(err, item){
      if (err)
        callback(err);
      else if (!item)
        callback();
      else if (item.text)
        console.log(item.text);
    });

coucou
