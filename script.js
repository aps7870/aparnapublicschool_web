document.addEventListener('DOMContentLoaded', () => {
    const classButtons = document.querySelectorAll('.class-btn');
    const pastTasksBtn = document.getElementById('past-tasks-btn');
    const calendarModal = document.getElementById('calendar-modal');
    const closeBtn = document.querySelector('.close-btn');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const currentMonthEl = document.getElementById('current-month');
    const calendarDays = document.getElementById('calendar-days');
    const submissionContent = document.getElementById('submission-content');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let currentSubmission = null;

    // Class selection
    classButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedClass = button.getAttribute('data-class');
            localStorage.setItem('selectedClass', selectedClass);
            window.location.href = 'form.html';
        });
    });

    // Modal controls
    pastTasksBtn.addEventListener('click', () => {
        calendarModal.style.display = 'block';
        renderCalendar();
    });

    closeBtn.addEventListener('click', () => {
        calendarModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.style.display = 'none';
        }
    });

    // Calendar navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Calendar rendering
    function renderCalendar() {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startingDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        currentMonthEl.textContent = `${firstDay.toLocaleString('default', { month: 'long' })} ${currentYear}`;
        calendarDays.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day';
            calendarDays.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Check if there's a submission for this date
            const submission = getSubmissionForDate(dateString);
            if (submission) {
                dayElement.classList.add('has-submission');
                dayElement.addEventListener('click', () => showSubmissionDetails(submission, dateString));
            }

            // Highlight today
            if (day === currentDate.getDate() && 
                currentMonth === currentDate.getMonth() && 
                currentYear === currentDate.getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarDays.appendChild(dayElement);
        }
    }

    // Get submission for a specific date
    function getSubmissionForDate(dateString) {
        const submissions = JSON.parse(localStorage.getItem('formData') || '{}');
        return submissions[dateString];
    }

    // Show submission details
    function showSubmissionDetails(submission, dateString) {
        currentSubmission = { ...submission, date: dateString };
        let content = '<div class="submission-info">';
        content += `<p><strong>Class:</strong> ${submission.class}</p>`;
        content += `<p><strong>Date:</strong> ${new Date(dateString).toLocaleDateString()}</p>`;
        content += '<div class="subjects-list">';
        
        submission.subjects.forEach(subject => {
            content += `
                <div class="subject-item">
                    <h4>${subject.subject}</h4>
                    <p><strong>Classwork:</strong> ${subject.classwork}</p>
                    <p><strong>Homework:</strong> ${subject.homework}</p>
                </div>
            `;
        });
        
        content += '</div>';
        content += '<div class="submission-actions">';
        content += '<button id="download-past-pdf" class="btn primary"><i class="fas fa-download"></i> Download PDF</button>';
        content += '</div></div>';
        submissionContent.innerHTML = content;

        // Add event listener to download button
        document.getElementById('download-past-pdf').addEventListener('click', () => {
            generatePastSubmissionPDF(currentSubmission);
        });
    }

    // Generate PDF for past submission
    function generatePastSubmissionPDF(submission) {
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
            doc.text(submission.class, 20, 25);
            
            // Add date with modern styling
            const submissionDate = new Date(submission.date).toLocaleDateString();
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colors.dark);
            doc.text(`Date: ${submissionDate}`, 20, 35);
            
            // Table configuration
            const headers = ['Subject', 'Classwork', 'Homework'];
            const columnWidths = [70, 60, 60];
            const baseRowHeight = 10;
            const startX = 20;
            const startY = 50;
            const tableWidth = 170;
            
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
            
            submission.subjects.forEach((subject, index) => {
                // Split long text into lines
                const classworkLines = splitTextIntoLines(doc, subject.classwork, columnWidths[1] - 10);
                const homeworkLines = splitTextIntoLines(doc, subject.homework, columnWidths[2] - 10);
                
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
                
                // Add subject
                doc.text(subject.subject, x + 5, y + 7);
                x += columnWidths[0];
                
                // Add classwork with line breaks
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
            doc.save(`${submission.class}_${submission.date}_subjects.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
        }
    }

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

    // Initial calendar render
    renderCalendar();
}); 