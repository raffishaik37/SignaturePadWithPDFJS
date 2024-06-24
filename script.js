$(document).ready(function () {
    let pdfDoc = null;
    let pageNum = 1;
    let scale = 1.5;
    let signaturePad = null;
    let signatureContainer = null;
    let currentSignature = null;
    let isDragging = false;
    let startX, startY;

    // Initialize PDF.js and load the document
    const loadingTask = pdfjsLib.getDocument('index.pdf');
    loadingTask.promise.then(function (pdfDocument) {
        pdfDoc = pdfDocument;
        renderPage(pageNum);
    });

    function renderPage(num) {
        pdfDoc.getPage(num).then(function (page) {
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            const renderTask = page.render(renderContext);
            renderTask.promise.then(function () {
                $('#pdfViewer').empty().append(canvas);
            });
        });
    }

    // Open signature popup
    $('#openSignaturePopup').on('click', function () {
        $('#signaturePopup').css('display', 'block');
        initializeSignaturePad();
    });

    // close document
    $('#closeSignaturePopup').on('click', function () {
        window.close();
    });

    // Close signature popup
    $('.close').on('click', function () {
        $('#signaturePopup').css('display', 'none');
    });

    // Initialize Signature Pad
    function initializeSignaturePad() {
        signaturePad = new SignaturePad(document.getElementById('signatureCanvas'), {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)',
        });

        // Clear signature button
        $('#clearSignature').on('click', function () {
            signaturePad.clear();
        });

        // Apply signature button
        $('#applySignature').on('click', function () {
            applySignature();
        });

        // Make signature resizable and draggable
        makeResizableAndDraggable();
    }

    // Apply signature to PDF
    function applySignature() {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = $('#pdfViewer canvas').width();
        canvas.height = $('#pdfViewer canvas').height();

        const pdfCanvas = $('#pdfViewer canvas')[0];
        context.drawImage(pdfCanvas, 0, 0);

        const signatureImage = new Image();
        signatureImage.src = signaturePad.toDataURL();

        const position = calculateSignaturePosition(); // Calculate position on PDF

        signatureImage.onload = function () {
            context.drawImage(signatureImage, position.x, position.y, signatureImage.width, signatureImage.height);
            const imageData = canvas.toDataURL('image/jpeg');

            // Replace PDF canvas with new canvas containing signature
            const newCanvas = document.createElement('canvas');
            newCanvas.width = canvas.width;
            newCanvas.height = canvas.height;

            const newContext = newCanvas.getContext('2d');
            newContext.drawImage(canvas, 0, 0);

            $('#pdfViewer').empty().append(newCanvas);

            // Close signature popup
            $('#signaturePopup').css('display', 'none');
        };
    }

    // Calculate signature position on PDF
    function calculateSignaturePosition() {
        const pdfViewerOffset = $('#pdfViewer').offset();
        const signatureCanvasOffset = $('#signatureCanvas').offset();

        const position = {
            x: signatureCanvasOffset.left - pdfViewerOffset.left,
            y: signatureCanvasOffset.top - pdfViewerOffset.top
        };

        return position;
    }

    // Make signature container resizable and draggable
    function makeResizableAndDraggable() {
        $('#signatureCanvas').resizable({
            aspectRatio: true,
            handles: 'se',
            minWidth: 50,
            minHeight: 50,
            start: function (event, ui) {
                $(this).data('origWidth', $(this).width());
                $(this).data('origHeight', $(this).height());
            },
            resize: function (event, ui) {
                const scale = ui.size.width / $(this).data('origWidth');
                $(this).css('transform', 'scale(' + scale + ')');
                $(signaturePad.canvas).css({
                    width: ui.size.width + 'px',
                    height: ui.size.height + 'px'
                });
                signaturePad.clear();
                signaturePad.fromDataURL(signaturePad.toDataURL());
            }
        });

        $('.popup-content').draggable({
            handle: ".popup-content h2"
        });
    }
});
