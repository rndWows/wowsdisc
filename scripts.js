document.addEventListener('DOMContentLoaded', function () {
    Promise.all([
        fetch('https://rndwows.github.io/wowsdisc/questions.json').then(response => response.json()),
        fetch('https://rndwows.github.io/wowsdisc/personality_info.json').then(response => response.json())
    ]).then(([questionsData, personalityData]) => {
        let currentQuestionIndex = 0;
        const questionsContainer = document.getElementById('questionsContainer');
        const userAnswers = {};
        const questionTemplate = document.getElementById('questionTemplate');


        function renderQuestion(index) {
            questionsContainer.innerHTML = '';
            const question = questionsData[index];
            const questionElement = questionTemplate.cloneNode(true);
            questionElement.style.display = 'block';
            questionElement.id = '';
        
            questionElement.querySelector('.question-title').textContent = `${question.question} (${question.id}/25)`;
        
            const table = questionElement.querySelector('table tbody');
            table.innerHTML = '';
        
            question.options.forEach((option, idx) => {
                const row = document.createElement('tr');
        
                const statementCell = document.createElement('td');
                statementCell.classList.add('statement');
                statementCell.textContent = option.text;
                row.appendChild(statementCell);
        
                const mostCell = document.createElement('td');
                mostCell.classList.add('most');
                const mostInput = document.createElement('input');
                mostInput.type = 'radio';
                mostInput.name = `q${question.id}_most`;
                mostInput.value = idx + 1;
                mostInput.dataset.group = option.group;
                if (userAnswers[question.id] && userAnswers[question.id].most === (idx + 1).toString()) {
                    mostInput.checked = true;
                }
                mostInput.addEventListener('change', handleRadioChange);
                mostCell.appendChild(mostInput);
                row.appendChild(mostCell);
        
                const leastCell = document.createElement('td');
                leastCell.classList.add('least');
                const leastInput = document.createElement('input');
                leastInput.type = 'radio';
                leastInput.name = `q${question.id}_least`;
                leastInput.value = idx + 1;
                leastInput.classList.add('least');
                leastInput.dataset.group = option.group;
                if (userAnswers[question.id] && userAnswers[question.id].least === (idx + 1).toString()) {
                    leastInput.checked = true;
                }
                leastInput.addEventListener('change', handleRadioChange);
                leastCell.appendChild(leastInput);
                row.appendChild(leastCell);
        
                table.appendChild(row);
            });
        
            questionsContainer.appendChild(questionElement);
        
            document.getElementById('prevButton').style.display = index > 0 ? 'inline-block' : 'none';
            document.getElementById('nextButton').style.display = index < questionsData.length - 1 ? 'inline-block' : 'none';
            document.getElementById('submitButton').style.display = index === questionsData.length - 1 ? 'inline-block' : 'none';
            updateNextButtonState();
        }
        

        function handleRadioChange(event) {
            const currentInput = event.target;
            const questionId = currentInput.name.split('_')[0].substring(1);
            const answerType = currentInput.name.split('_')[1];

            if (!userAnswers[questionId]) {
                userAnswers[questionId] = {};
            }

            userAnswers[questionId][answerType] = currentInput.value;

            const mostInput = document.querySelector(`input[name="q${questionId}_most"]:checked`);
            const leastInput = document.querySelector(`input[name="q${questionId}_least"]:checked`);

            if (mostInput && leastInput && mostInput.value === leastInput.value) {

                Toastify({
                    text: "Bạn không thể chọn cùng một câu trả lời cho Most và Least.",
             
                    style: {
                        background: "linear-gradient(to right, #d55349, #d59894)",
                    }
                }).showToast();
                currentInput.checked = false;
                delete userAnswers[questionId][answerType];
            }

            updateNextButtonState();
        }

        function updateNextButtonState() {
            const mostInput = document.querySelector(`input[name="q${questionsData[currentQuestionIndex].id}_most"]:checked`);
            const leastInput = document.querySelector(`input[name="q${questionsData[currentQuestionIndex].id}_least"]:checked`);
            document.getElementById('nextButton').disabled = !(mostInput && leastInput);
        }

        window.nextQuestion = function () {
            if (currentQuestionIndex < questionsData.length - 1) {
                currentQuestionIndex++;
                renderQuestion(currentQuestionIndex);
            }
        }

        window.prevQuestion = function () {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuestion(currentQuestionIndex);
            }
        }

        window.submitUserInfo = function () {
            const userName = document.getElementById('userName').value;
            const userEmail = document.getElementById('userEmail').value;

            if (userName && userEmail) {
                const userInfoModalElement = document.getElementById('userInfoModal');
                const userInfoModal = bootstrap.Modal.getInstance(userInfoModalElement);
                userInfoModal.hide();
                displayResults(userName, userEmail);
            } else {
                Toastify({
                    text: "Vui lòng nhập đủ thông tin",
                    duration: 3000,
        
                    gravity: "top", // `top` or `bottom`
                    position: "right", // `left`, `center` or `right`
                    stopOnFocus: true, // Prevents dismissing of toast on hover
                    style: {
                        background: "linear-gradient(to right, #d55349, #d59894)",
                    },
                    onClick: function () { } // Callback after click
                }).showToast();

            }
        }

        document.getElementById('discTestForm').addEventListener('submit', function (event) {
            event.preventDefault();

            const results = [];
            const resultContainer = document.getElementById('resultContainer');
            resultContainer.innerHTML = '';

            const mostCounts = { D: 0, I: 0, S: 0, C: 0 };
            const leastCounts = { D: 0, I: 0, S: 0, C: 0 };

            for (let question of questionsData) {
                const questionNumber = question.id.toString();
                const mostSelected = userAnswers[questionNumber] && userAnswers[questionNumber].most;
                const leastSelected = userAnswers[questionNumber] && userAnswers[questionNumber].least;

                if (mostSelected && leastSelected) {
                    const mostGroup = question.options[mostSelected - 1].group;
                    const leastGroup = question.options[leastSelected - 1].group;
                    mostCounts[mostGroup]++;
                    leastCounts[leastGroup]++;
                    results.push({
                        question: questionNumber,
                        most: question.options[mostSelected - 1].text,
                        least: question.options[mostSelected - 1].text
                    });
                } else {
                    Toastify({
                        text: `Bạn chưa hoàn thành câu hỏi số ${questionNumber}`,
                        duration: 3000,
                     
                        gravity: "top", // `top` or `bottom`
                        position: "right", // `left`, `center` or `right`
                        stopOnFocus: true, // Prevents dismissing of toast on hover
                        style: {
                            background: "linear-gradient(to right, #d55349, #d59894)",
                        },
                        onClick: function () { } // Callback after click
                    }).showToast();

                    return;
                }
            }

            const userInfoModal = new bootstrap.Modal(document.getElementById('userInfoModal'));
            userInfoModal.show();
        });
        function sendDataToGoogleSheets(data) {
            fetch('https://script.google.com/macros/s/AKfycbx7N79uod4APVa_GKRiME8WGtyn9LSdKYd1OmBadbV-7BRqL0uUe6b1YEYp-mtfEtRn8Q/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                mode: 'no-cors'     
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    console.log('Dữ liệu đã được lưu thành công!');
                } else {
                    console.error('Đã xảy ra lỗi khi lưu dữ liệu.');
                }
            })
            .catch(error => {
                
            });
        }
        
        
        function displayResults(userName, userEmail) {
            const resultContainer = document.getElementById('resultContainer');
            resultContainer.innerHTML = ''; // Clear previous results
        
            const results = [];
            const mostCounts = { D: 0, I: 0, S: 0, C: 0 };
            const leastCounts = { D: 0, I: 0, S: 0, C: 0 };
        
            for (let question of questionsData) {
                const questionNumber = question.id.toString();
                const mostSelected = userAnswers[questionNumber] && userAnswers[questionNumber].most;
                const leastSelected = userAnswers[questionNumber] && userAnswers[questionNumber].least;
        
                if (mostSelected && leastSelected) {
                    const mostGroup = question.options[mostSelected - 1].group;
                    const leastGroup = question.options[leastSelected - 1].group;
                    mostCounts[mostGroup]++;
                    leastCounts[leastGroup]++;
                    results.push({
                        question: questionNumber,
                        most: question.options[mostSelected - 1].text,
                        least: question.options[leastSelected - 1].text
                    });
                }
            }
        
            const mostGroups = Object.entries(mostCounts).sort((a, b) => b[1] - a[1]);
            let topMostGroups = mostGroups.slice(0, 2);
        
            if (topMostGroups[0][1] === topMostGroups[1][1]) {
                const firstGroup = topMostGroups[0][0];
                const secondGroup = topMostGroups[1][0];
                if (leastCounts[firstGroup] > leastCounts[secondGroup]) {
                    topMostGroups = [[secondGroup, mostCounts[secondGroup]], [firstGroup, mostCounts[firstGroup]]];
                }
            }
        
            const personalityType = topMostGroups.map(group => group[0]).join('');
        
            const personalityInfo = personalityData.find(info => info.personalityGroup === personalityType);
        
            document.getElementById('discTestForm').style.display = 'none';
        
            // Ensure the chart container exists
            let chartContainer = document.getElementById('resultChart');
            if (!chartContainer) {
                chartContainer = document.createElement('div');
                chartContainer.id = 'resultChart';
                chartContainer.classList.add('mt-3');
                resultContainer.appendChild(chartContainer);
            }
        
            // Highcharts Pie Chart with custom animation
            Highcharts.chart('resultChart', {
                chart: {
                    type: 'pie'
                },
                title: {
                    text: 'Kết quả nhóm tính cách của bạn'
                },
                tooltip: {
                    valueSuffix: '%'
                },
                subtitle: {
                    text: 'Source: Custom Test'
                },
                plotOptions: {
                    series: {
                        allowPointSelect: true,
                        cursor: 'pointer',
                        dataLabels: [{
                            enabled: true,
                            distance: 20
                        }, {
                            enabled: true,
                            distance: -40,
                            format: '{point.percentage:.1f}%',
                            style: {
                                fontSize: '1.2em',
                                textOutline: 'none',
                                opacity: 0.7
                            },
                            filter: {
                                operator: '>',
                                property: 'percentage',
                                value: 10
                            }
                        }]
                    }
                },
                series: [{
                    name: 'Percentage',
                    colorByPoint: true,
                    data: [
                        {
                            name: 'D',
                            y: mostCounts.D
                        },
                        {
                            name: 'I',
                            sliced: true,
                            selected: true,
                            y: mostCounts.I
                        },
                        {
                            name: 'S',
                            y: mostCounts.S
                        },
                        {
                            name: 'C',
                            y: mostCounts.C
                        }
                    ]
                }]
            });
        
            const personalityTypeDiv = document.createElement('div');
            personalityTypeDiv.textContent = `Nhóm tính cách của bạn: ${personalityType}`;
            personalityTypeDiv.classList.add('personality-type', 'alert', 'alert-info');
            resultContainer.appendChild(personalityTypeDiv);
        
            if (personalityInfo) {
                const infoDiv = document.createElement('div');
                infoDiv.classList.add('personality-info', 'mt-3');
        
                const name = document.createElement('p');
                name.innerHTML = `<strong>Tên phong cách:</strong> ${personalityInfo.personalityName}`;
                infoDiv.appendChild(name);
        
                const style = document.createElement('p');
                style.innerHTML = `<strong>Phong cách:</strong>`;
                const styleList = document.createElement('ul');
                personalityInfo.style.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    styleList.appendChild(listItem);
                });
                style.appendChild(styleList);
                infoDiv.appendChild(style);
        
                const leadershipStyle = document.createElement('p');
                leadershipStyle.innerHTML = `<strong>Phong cách lãnh đạo:</strong>`;
                const leadershipStyleList = document.createElement('ul');
                personalityInfo.leadershipStyle.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    leadershipStyleList.appendChild(listItem);
                });
                leadershipStyle.appendChild(leadershipStyleList);
                infoDiv.appendChild(leadershipStyle);
        
                const improvementPoints = document.createElement('p');
                improvementPoints.innerHTML = `<strong>Điểm cần cải thiện:</strong>`;
                const improvementPointsList = document.createElement('ul');
                personalityInfo.improvementPoints.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.textContent = item;
                    improvementPointsList.appendChild(listItem);
                });
                improvementPoints.appendChild(improvementPointsList);
                infoDiv.appendChild(improvementPoints);
        
                const careers = document.createElement('p');
                careers.innerHTML = `<strong>Nghề nghiệp phù hợp:</strong>`;
                personalityInfo.suitableCareers.forEach(item => {
                    const badge = document.createElement('span');
                    badge.classList.add('badge', 'bg-primary', 'me-1', 'mb-1');
                    badge.textContent = item;
                    careers.appendChild(badge);
                });
                infoDiv.appendChild(careers);
        
                resultContainer.appendChild(infoDiv);
            }
        
            const resultTable = document.createElement('table');
            resultTable.classList.add('result-table', 'table', 'table-bordered', 'mt-3');
        
            const headerRow = document.createElement('tr');
            const headerQuestion = document.createElement('th');
            headerQuestion.textContent = 'Câu hỏi';
            const headerMost = document.createElement('th');
            headerMost.textContent = 'Most (Giống bạn nhất)';
            const headerLeast = document.createElement('th');
            headerLeast.textContent = 'Least (Ít giống bạn nhất)';
            headerRow.appendChild(headerQuestion);
            headerRow.appendChild(headerMost);
            headerRow.appendChild(headerLeast);
            resultTable.appendChild(headerRow);
        
            results.forEach(result => {
                const row = document.createElement('tr');
                const cellQuestion = document.createElement('td');
                cellQuestion.textContent = `Câu ${result.question}`;
                const cellMost = document.createElement('td');
                cellMost.textContent = result.most;
                const cellLeast = document.createElement('td');
                cellLeast.textContent = result.least;
                row.appendChild(cellQuestion);
                row.appendChild(cellMost);
                row.appendChild(cellLeast);
                resultTable.appendChild(row);
            });
        
            resultContainer.appendChild(resultTable);
        
            // Calculate percentages
            const totalMost = mostCounts.D + mostCounts.I + mostCounts.S + mostCounts.C;
            const percentageTable = document.createElement('table');
            percentageTable.classList.add('percentage-table', 'table', 'table-bordered', 'mt-3');
        
            const percentageHeaderRow = document.createElement('tr');
            const headerType = document.createElement('th');
            headerType.textContent = 'Loại';
            const headerPercentage = document.createElement('th');
            headerPercentage.textContent = 'Phần trăm (%)';
            percentageHeaderRow.appendChild(headerType);
            percentageHeaderRow.appendChild(headerPercentage);
            percentageTable.appendChild(percentageHeaderRow);
        
            const types = ['D', 'I', 'S', 'C'];
            types.forEach(type => {
                const row = document.createElement('tr');
                const cellType = document.createElement('td');
                cellType.textContent = type;
                const cellPercentage = document.createElement('td');
                const percentage = ((mostCounts[type] / totalMost) * 100).toFixed(2);
                cellPercentage.textContent = `${percentage}%`;
                row.appendChild(cellType);
                row.appendChild(cellPercentage);
                percentageTable.appendChild(row);
            });
        
            resultContainer.appendChild(percentageTable);
        
            // Prepare data to send
            const dataToSend = {
                userName: userName,
                userEmail: userEmail,
                personalityType: personalityType,
                results: results,
                mostCounts: mostCounts,
                leastCounts: leastCounts
            };
        
            // Send data to Google Sheets
            sendDataToGoogleSheets(dataToSend);
        }
        
        

        renderQuestion(currentQuestionIndex);
    }).catch(error => console.error('Error loading data:', error));
});
