// Survey Application JavaScript

class SurveyApp {
    constructor() {
        this.surveys = JSON.parse(localStorage.getItem('surveys')) || [];
        this.responses = JSON.parse(localStorage.getItem('responses')) || [];
        this.currentSurvey = null;
        this.questionCount = 1;
        
        this.initializeApp();
    }

    initializeApp() {
        this.setupEventListeners();
        this.updateSurveyList();
        this.updateResults();
    }

    setupEventListeners() {
        // Check if DOM elements exist before setting up listeners
        const createBtn = document.getElementById('create-btn');
        const takeBtn = document.getElementById('take-btn');
        const resultsBtn = document.getElementById('results-btn');
        const addQuestionBtn = document.getElementById('add-question-btn');
        const surveyForm = document.getElementById('survey-form');

        // Navigation buttons
        if (createBtn) createBtn.addEventListener('click', () => this.showSection('create'));
        if (takeBtn) takeBtn.addEventListener('click', () => this.showSection('take'));
        if (resultsBtn) resultsBtn.addEventListener('click', () => this.showSection('results'));

        // Survey creation
        if (addQuestionBtn) addQuestionBtn.addEventListener('click', () => this.addQuestion());
        if (surveyForm) surveyForm.addEventListener('submit', (e) => this.createSurvey(e));

        // Dynamic question type handling
        this.setupQuestionTypeHandlers();
    }

    setupQuestionTypeHandlers() {
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('question-type')) {
                const choicesContainer = e.target.closest('.question-item').querySelector('.choices-container');
                if (e.target.value === 'multiple-choice') {
                    choicesContainer.style.display = 'block';
                } else {
                    choicesContainer.style.display = 'none';
                }
            }
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section and activate button
        document.getElementById(`${sectionName}-section`).classList.add('active');
        document.getElementById(`${sectionName}-btn`).classList.add('active');

        // Update content if needed
        if (sectionName === 'take') {
            this.updateSurveyList();
        } else if (sectionName === 'results') {
            this.updateResults();
        }
    }

    addQuestion() {
        this.questionCount++;
        const questionsContainer = document.getElementById('questions-container');
        
        const questionHTML = `
            <div class="question-item">
                <button type="button" class="remove-question-btn" onclick="this.parentElement.remove()">×</button>
                <div class="form-group">
                    <label>Question ${this.questionCount}:</label>
                    <input type="text" class="question-text" placeholder="Enter your question" required>
                </div>
                <div class="form-group">
                    <label>Type:</label>
                    <select class="question-type">
                        <option value="text">Text</option>
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="rating">Rating (1-5)</option>
                    </select>
                </div>
                <div class="choices-container" style="display: none;">
                    <label>Choices (one per line):</label>
                    <textarea class="question-choices" rows="3" placeholder="Option 1&#10;Option 2&#10;Option 3"></textarea>
                </div>
            </div>
        `;
        
        questionsContainer.insertAdjacentHTML('beforeend', questionHTML);
    }

    createSurvey(e) {
        e.preventDefault();
        
        const title = document.getElementById('survey-title').value;
        const description = document.getElementById('survey-description').value;
        const questionItems = document.querySelectorAll('.question-item');
        
        const questions = [];
        questionItems.forEach((item, index) => {
            const text = item.querySelector('.question-text').value;
            const type = item.querySelector('.question-type').value;
            const choices = type === 'multiple-choice' 
                ? item.querySelector('.question-choices').value.split('\n').filter(choice => choice.trim())
                : [];
            
            questions.push({
                id: index + 1,
                text,
                type,
                choices
            });
        });

        const survey = {
            id: Date.now(),
            title,
            description,
            questions,
            createdAt: new Date().toISOString()
        };

        this.surveys.push(survey);
        this.saveSurveys();
        
        alert('Survey created successfully!');
        this.resetForm();
        this.updateSurveyList();
    }

    resetForm() {
        document.getElementById('survey-form').reset();
        const questionsContainer = document.getElementById('questions-container');
        const questionItems = questionsContainer.querySelectorAll('.question-item');
        
        // Remove all questions except the first one
        for (let i = 1; i < questionItems.length; i++) {
            questionItems[i].remove();
        }
        
        // Reset question count and hide choices container
        this.questionCount = 1;
        questionsContainer.querySelector('.choices-container').style.display = 'none';
    }

    updateSurveyList() {
        const surveyList = document.getElementById('survey-list');
        
        // Check if element exists
        if (!surveyList) return;
        
        if (this.surveys.length === 0) {
            surveyList.innerHTML = '<p>No surveys available. Create one first!</p>';
            return;
        }

        surveyList.innerHTML = this.surveys.map(survey => `
            <div class="survey-item" onclick="app.takeSurvey(${survey.id})">
                <h3>${survey.title}</h3>
                <p>${survey.description}</p>
                <div class="survey-meta">
                    Created: ${new Date(survey.createdAt).toLocaleDateString()}
                    | Questions: ${survey.questions.length}
                </div>
            </div>
        `).join('');
    }

    takeSurvey(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) return;

        this.currentSurvey = survey;
        const surveyList = document.getElementById('survey-list');
        
        const formHTML = `
            <div class="survey-form">
                <h3>${survey.title}</h3>
                <p>${survey.description}</p>
                <form id="response-form">
                    ${survey.questions.map(q => this.renderQuestion(q)).join('')}
                    <button type="submit">Submit Response</button>
                    <button type="button" onclick="app.updateSurveyList()">Back to Surveys</button>
                </form>
            </div>
        `;
        
        surveyList.innerHTML = formHTML;
        document.getElementById('response-form').addEventListener('submit', (e) => this.submitResponse(e));
    }

    renderQuestion(question) {
        switch (question.type) {
            case 'text':
                return `
                    <div class="survey-question">
                        <h4>${question.text}</h4>
                        <input type="text" name="q_${question.id}" required>
                    </div>
                `;
            
            case 'multiple-choice':
                return `
                    <div class="survey-question">
                        <h4>${question.text}</h4>
                        ${question.choices.map(choice => `
                            <div class="choice-item">
                                <input type="radio" id="q_${question.id}_${choice}" name="q_${question.id}" value="${choice}" required>
                                <label for="q_${question.id}_${choice}">${choice}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
            
            case 'rating':
                return `
                    <div class="survey-question">
                        <h4>${question.text}</h4>
                        <div class="rating-container">
                            <span>1</span>
                            ${[1, 2, 3, 4, 5].map(rating => `
                                <input type="radio" id="q_${question.id}_${rating}" name="q_${question.id}" value="${rating}" required>
                                <label for="q_${question.id}_${rating}">${rating}</label>
                            `).join('')}
                            <span>5</span>
                        </div>
                    </div>
                `;
            
            default:
                return '';
        }
    }

    submitResponse(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const answers = {};
        
        for (let [key, value] of formData.entries()) {
            answers[key] = value;
        }

        const response = {
            id: Date.now(),
            surveyId: this.currentSurvey.id,
            answers,
            submittedAt: new Date().toISOString()
        };

        this.responses.push(response);
        this.saveResponses();
        
        alert('Thank you for your response!');
        this.updateSurveyList();
    }

    updateResults() {
        const resultsContainer = document.getElementById('results-container');
        
        // Check if element exists
        if (!resultsContainer) return;
        
        if (this.surveys.length === 0) {
            resultsContainer.innerHTML = '<p>No surveys available yet.</p>';
            return;
        }

        const resultsHTML = this.surveys.map(survey => {
            const surveyResponses = this.responses.filter(r => r.surveyId === survey.id);
            
            return `
                <div class="result-item">
                    <h3>${survey.title}</h3>
                    <div class="response-count">Total Responses: ${surveyResponses.length}</div>
                    ${surveyResponses.length > 0 ? this.generateSurveyAnalysis(survey, surveyResponses) : '<p>No responses yet.</p>'}
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = resultsHTML;
    }

    generateSurveyAnalysis(survey, responses) {
        return survey.questions.map(question => {
            const questionKey = `q_${question.id}`;
            const answers = responses.map(r => r.answers[questionKey]).filter(a => a);
            
            if (question.type === 'multiple-choice' || question.type === 'rating') {
                const counts = {};
                answers.forEach(answer => {
                    counts[answer] = (counts[answer] || 0) + 1;
                });
                
                const total = answers.length;
                const percentages = Object.entries(counts).map(([answer, count]) => {
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    return `${answer}: ${count} (${percentage}%)`;
                }).join('<br>');
                
                return `
                    <div class="response-summary">
                        <strong>${question.text}</strong><br>
                        ${percentages || 'No responses'}
                    </div>
                `;
            } else {
                return `
                    <div class="response-summary">
                        <strong>${question.text}</strong><br>
                        ${answers.length} text responses received
                    </div>
                `;
            }
        }).join('');
    }

    saveSurveys() {
        localStorage.setItem('surveys', JSON.stringify(this.surveys));
    }

    saveResponses() {
        localStorage.setItem('responses', JSON.stringify(this.responses));
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SurveyApp();
});