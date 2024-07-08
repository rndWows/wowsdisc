document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        fetch('questions.json').then(response => response.json()),
        fetch('personality_info.json').then(response => response.json())
    ]).then(([questionsData, personalityData]) => {
        let currentQuestionIndex = 0;
        const questionsContainer = document.getElementById('questionsContainer');
        const userAnswers = {};

        function renderQuestion(index) {
            questionsContainer.innerHTML = '';
            const question = questionsData[index];
            const questionDiv = document.createElement('div');
            questionDiv.classList.add('question');
            
            const questionTitle = document.createElement('p');
            questionTitle.textContent = `${question.question} (${question.id}/25)`;
            questionDiv.appendChild(questionTitle);
            
            const table = document.createElement('table');
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
            questionDiv.appendChild(table);
            questionsContainer.appendChild(questionDiv);
            
            document.getElementById('prevButton').style.display = index > 0 ? 'inline-block' : 'none';
            document.getElementById('nextButton').style.display = index < questionsData.length - 1 ? 'inline-block' : 'none';
            document.getElementById('submitButton').style.display = index === questionsData.length - 1 ? 'inline-block' : 'none';
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
                alert('Bạn không thể chọn cùng một câu trả lời cho Most và Least.');
                currentInput.checked = false;
                delete userAnswers[questionId][answerType];
            }
        }

        window.nextQuestion = function() {
            if (currentQuestionIndex < questionsData.length - 1) {
                currentQuestionIndex++;
                renderQuestion(currentQuestionIndex);
            }
        }

        window.prevQuestion = function() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                renderQuestion(currentQuestionIndex);
            }
        }

        document.getElementById('discTestForm').addEventListener('submit', function(event) {
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
                        least: question.options[leastSelected - 1].text
                    });
                } else {
                    alert(`Bạn chưa hoàn thành câu hỏi số ${questionNumber}`);
                    return;
                }
            }

            // Determine the top two groups for "Most"
            const mostGroups = Object.entries(mostCounts).sort((a, b) => b[1] - a[1]);
            let topMostGroups = mostGroups.slice(0, 2);

            // If top two groups have same count, use "Least" count to determine the order
            if (topMostGroups[0][1] === topMostGroups[1][1]) {
                const firstGroup = topMostGroups[0][0];
                const secondGroup = topMostGroups[1][0];
                if (leastCounts[firstGroup] > leastCounts[secondGroup]) {
                    topMostGroups = [[secondGroup, mostCounts[secondGroup]], [firstGroup, mostCounts[firstGroup]]];
                }
            }

            const personalityType = topMostGroups.map(group => group[0]).join('');

            // Find personality information
            const personalityInfo = personalityData.find(info => info.personalityGroup === personalityType);

            // Hide the form
            document.getElementById('discTestForm').style.display = 'none';

            // Display the personality type
            const personalityTypeDiv = document.createElement('div');
            personalityTypeDiv.textContent = `Nhóm tính cách của bạn: ${personalityType}`;
            personalityTypeDiv.classList.add('personality-type');
            resultContainer.appendChild(personalityTypeDiv);

            // Display the personality information
            if (personalityInfo) {
                const infoDiv = document.createElement('div');
                infoDiv.classList.add('personality-info');
                
                const name = document.createElement('p');
                name.textContent = `Tên phong cách: ${personalityInfo.personalityName}`;
                infoDiv.appendChild(name);
                
                const style = document.createElement('p');
                style.textContent = `Phong cách: ${personalityInfo.style.join(', ')}`;
                infoDiv.appendChild(style);
                
                const leadershipStyle = document.createElement('p');
                leadershipStyle.textContent = `Phong cách lãnh đạo: ${personalityInfo.leadershipStyle.join(', ')}`;
                infoDiv.appendChild(leadershipStyle);
                
                const improvementPoints = document.createElement('p');
                improvementPoints.textContent = `Điểm cần cải thiện: ${personalityInfo.improvementPoints.join(', ')}`;
                infoDiv.appendChild(improvementPoints);
                
                const careers = document.createElement('p');
                careers.textContent = `Nghề nghiệp phù hợp: ${personalityInfo.suitableCareers.join(', ')}`;
                infoDiv.appendChild(careers);

                resultContainer.appendChild(infoDiv);
            }

            // Create a table to display the results
            const resultTable = document.createElement('table');
            resultTable.classList.add('result-table');

            // Create table header
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

            // Populate table with results
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

            // Create a canvas for the chart
            const canvas = document.createElement('canvas');
            canvas.id = 'resultChart';
            resultContainer.appendChild(canvas);

            // Create the chart
            const ctx = document.getElementById('resultChart').getContext('2d');
            const chartData = {
                labels: ['D', 'I', 'S', 'C'],
                datasets: [
                    {
                        label: 'Most (Giống bạn nhất)',
                        data: [mostCounts.D, mostCounts.I, mostCounts.S, mostCounts.C],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Least (Ít giống bạn nhất)',
                        data: [leastCounts.D, leastCounts.I, leastCounts.S, leastCounts.C],
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            };

            const resultChart = new Chart(ctx, {
                type: 'bar',
                data: chartData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        });

        renderQuestion(currentQuestionIndex);
    }).catch(error => console.error('Error loading data:', error));
});
