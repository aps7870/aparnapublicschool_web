document.addEventListener('DOMContentLoaded', () => {
    const selectedClass = localStorage.getItem('selectedClass');
    if (!selectedClass) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('selected-class').textContent = selectedClass;

    // Define subject lists for different classes
    const subjectLists = {
        'UKG': ['Hindi', 'Maths', 'English', 'GA', 'Game'],
        'default': [
            'English Lit', 'English Gr', 'Hindi Gr', 'Hindi Lit', 'Math',
            'Science', 'Computer', 'GK', 'Drawing', 'M Science', 'SSt', 'Game'
        ]
    };

    // Get the appropriate subject list for the selected class
    const subjects = subjectLists[selectedClass] || subjectLists.default;
    
    // Determine number of rows based on class
    const numberOfRows = selectedClass === 'UKG' ? 4 : 7;

    const subjectRows = document.getElementById('subject-rows');
    
    // Create subject rows based on class
    for (let i = 0; i < numberOfRows; i++) {
        const row = document.createElement('div');
        row.className = 'subject-row';
        
        // Subject dropdown
        const subjectSelect = document.createElement('select');
        subjectSelect.required = true;
        subjectSelect.innerHTML = `
            <option value="">Select Subject</option>
            ${subjects.map(subject => `<option value="${subject}">${subject}</option>`).join('')}
        `;
        
        // Classwork input
        const classworkInput = document.createElement('input');
        classworkInput.type = 'text';
        classworkInput.placeholder = 'Classwork';
        classworkInput.required = true;
        
        // Homework input
        const homeworkInput = document.createElement('input');
        homeworkInput.type = 'text';
        homeworkInput.placeholder = 'Homework';
        homeworkInput.required = true;
        
        row.appendChild(subjectSelect);
        row.appendChild(classworkInput);
        row.appendChild(homeworkInput);
        
        subjectRows.appendChild(row);
    }

    // Form submission
    const form = document.getElementById('subject-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            class: selectedClass,
            subjects: []
        };

        document.querySelectorAll('.subject-row').forEach(row => {
            const subject = row.querySelector('select').value;
            const classwork = row.querySelector('input:nth-child(2)').value;
            const homework = row.querySelector('input:nth-child(3)').value;
            
            formData.subjects.push({ subject, classwork, homework });
        });

        // Save to localStorage
        localStorage.setItem('formData', JSON.stringify(formData));
        alert('Data saved successfully!');
    });

    // Helper function to split text into lines
    function splitTextIntoLines(doc, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = doc.getTextWidth(testLine);
            
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // PDF Download
    document.getElementById('download-btn').addEventListener('click', () => {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Set colors
            const colors = {
                primary: [122, 157, 122], // #7a9d7a
                light: [232, 240, 232],   // #e8f0e8
                dark: [74, 107, 74],      // #4a6b4a
                text: [44, 62, 44]        // #2c3e2c
            };

            // Add decorative header
            doc.setFillColor(...colors.light);
            doc.rect(0, 0, 210, 40, 'F');
            
            // Add title with modern styling
            doc.setFontSize(28);
            doc.setTextColor(...colors.text);
            doc.setFont('helvetica', 'bold');
            doc.text(selectedClass, 20, 25);
            
            // Add date with modern styling
            const today = new Date().toLocaleDateString();
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.dark);
            doc.text(`Date: ${today}`, 20, 35);
            
            // Table configuration with adjusted column widths
            const headers = ['Subject', 'Classwork', 'Homework'];
            const columnWidths = [50, 70, 70]; // Adjusted widths
            const baseRowHeight = 10;
            const tableWidth = 190; // Total table width
            const pageWidth = 210; // PDF page width
            const startX = (pageWidth - tableWidth) / 2; // Center the table
            const startY = 50;
            
            // Draw header row with modern styling
            doc.setFillColor(...colors.primary);
            doc.rect(startX, startY, tableWidth, baseRowHeight, 'F');
            doc.setDrawColor(...colors.dark);
            doc.rect(startX, startY, tableWidth, baseRowHeight);
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            
            // Add header text
            let x = startX;
            headers.forEach((header, i) => {
                doc.text(header, x + 5, startY + 7);
                x += columnWidths[i];
            });
            
            // Table content
            let y = startY + baseRowHeight;
            doc.setFontSize(11);
            doc.setTextColor(...colors.text);
            doc.setFont('helvetica', 'normal');
            
            document.querySelectorAll('.subject-row').forEach((row, index) => {
                const subject = row.querySelector('select').value;
                const classwork = row.querySelector('input:nth-child(2)').value;
                const homework = row.querySelector('input:nth-child(3)').value;
                
                // Split long text into lines
                const classworkLines = splitTextIntoLines(doc, classwork, columnWidths[1] - 10);
                const homeworkLines = splitTextIntoLines(doc, homework, columnWidths[2] - 10);
                
                // Calculate row height based on content
                const maxLines = Math.max(classworkLines.length, homeworkLines.length, 1);
                const rowHeight = baseRowHeight * maxLines;
                
                // Alternate row background
                const rowColor = index % 2 === 0 ? [255, 255, 255] : colors.light;
                doc.setFillColor(...rowColor);
                doc.rect(startX, y, tableWidth, rowHeight, 'F');
                doc.setDrawColor(...colors.dark);
                doc.rect(startX, y, tableWidth, rowHeight);
                
                // Draw vertical lines for columns
                x = startX;
                for (let i = 0; i < columnWidths.length; i++) {
                    x += columnWidths[i];
                    doc.line(x, y, x, y + rowHeight);
                }
                
                // Add content
                x = startX;
                
                // Add subject with smaller font for longer names
                doc.setFontSize(10);
                doc.text(subject, x + 5, y + 7);
                x += columnWidths[0];
                
                // Add classwork with line breaks
                doc.setFontSize(11);
                classworkLines.forEach((line, index) => {
                    doc.text(line, x + 5, y + 7 + (index * baseRowHeight));
                });
                x += columnWidths[1];
                
                // Add homework with line breaks
                homeworkLines.forEach((line, index) => {
                    doc.text(line, x + 5, y + 7 + (index * baseRowHeight));
                });
                
                y += rowHeight;
            });
            
            // Add decorative footer with reduced spacing
            doc.setFillColor(...colors.light);
            doc.rect(0, y + 10, 210, 30, 'F');
            
            // Add footer text with reduced spacing
            doc.setFontSize(10);
            doc.setTextColor(...colors.dark);
            doc.text('Generated on: ' + new Date().toLocaleString(), 20, y + 25);
            
            // Save the PDF
            doc.save(`${selectedClass}_subjects.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    });
}); 