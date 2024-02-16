class Question {
    constructor(question, choices, correctAnswer) {
        this.question = question;
        this.choices = choices; // Array of all possible answers
        this.correctAnswer = correctAnswer;
    }

    checkAnswer(answer) {
        return answer === this.correctAnswer;
    }
}

class User {
    constructor(username) {
        this.username = username;
        this.score_history = [];
    }

    addScore(score) {
        this.score_history.push(score);
    }

    getScoreHistory() {
        return this.score_history.slice();
    }

    getUsername() {
        return this.username;
    }
}

class Quiz {
    constructor(questions) {
        this.questionsByDifficulty = { 'easy': [], 'medium': [], 'hard': [] };
        questions.forEach(question => {
            this.questionsByDifficulty[question.difficulty].push(new Question(question.question, question.choices, question.correctAnswer));
        });

        this.difficulties = ['easy', 'medium', 'hard']; // Define an array to easily navigate between difficulties
        this.currentDifficultyIndex = 0; // Use an index to track the current difficulty level
        this.score = 0;
        this.totalQuestionsAttempted = 0;
        this.totalQuestions = questions.length;
    }

    *generateQuestions() {
        while (this.totalQuestionsAttempted < this.totalQuestions) {
            const currentQuestion = this.getCurrentQuestion();
            if (currentQuestion) {
                console.log(currentQuestion);
                yield currentQuestion;
            } else {
                break; // No more questions available
            }
        }
    }

    getCurrentQuestion() {
        // Try to get a question from the current difficulty level
        while (this.currentDifficultyIndex < this.difficulties.length) {
            const difficulty = this.difficulties[this.currentDifficultyIndex];
            if (this.questionsByDifficulty[difficulty].length > 0) {
                return this.questionsByDifficulty[difficulty][0];
            } else {
                // If no questions left in the current difficulty, attempt to move to the next available difficulty
                this.currentDifficultyIndex++; // Move to the next difficulty
            }
        }
        return null; // No more questions available
    }

    submitAnswer(answer) {
        const currentQuestion = this.getCurrentQuestion();
        if (currentQuestion) {
            const wasCorrect = currentQuestion.checkAnswer(answer);
            if (wasCorrect) {
                this.score++;
            }
            // Remove the answered question and adjust difficulty
            const currentDifficulty = this.difficulties[this.currentDifficultyIndex];
            this.questionsByDifficulty[currentDifficulty].shift(); // Remove the first question
            this.adjustDifficulty(wasCorrect);
            this.totalQuestionsAttempted++;
        }
    }

    adjustDifficulty(correct) {
        if (correct) {
            // Only attempt to increase difficulty if not at the highest level
            if (this.currentDifficultyIndex < this.difficulties.length - 1) {
                this.currentDifficultyIndex++;
            }
        } else {
            // Only decrease difficulty if not at the easiest level
            if (this.currentDifficultyIndex > 0) {
                this.currentDifficultyIndex--;
            }
        }
        // After adjusting difficulty, check if the new difficulty has questions. If not, find the next available difficulty with questions.
        this.findNextAvailableDifficulty();
    }

    findNextAvailableDifficulty() {
        // Check if current difficulty has questions
        if (this.questionsByDifficulty[this.difficulties[this.currentDifficultyIndex]].length === 0) {
            // Look for the next available difficulty with questions
            let foundQuestions = false;
            for (let i = 0; i < this.difficulties.length; i++) {
                if (this.questionsByDifficulty[this.difficulties[i]].length > 0) {
                    this.currentDifficultyIndex = i;
                    foundQuestions = true;
                    break;
                }
            }
            if (!foundQuestions) {
                this.currentDifficultyIndex = this.difficulties.length; // No questions available in any difficulty
            }
        }
    }

    hasEnded() {
        return this.totalQuestionsAttempted >= this.totalQuestions;
    }
}

async function fetchQuestions() {
    const response = await fetch('https://opentdb.com/api.php?amount=5&type=multiple');
    const data = await response.json();
    return data.results.map(q => ({
        question: q.question,
        choices: [...q.incorrect_answers, q.correct_answer],
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty 
    }));
}

function showQuiz() {
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('question-container').style.display = 'flex';
}

function restartQuiz(user){
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('quiz-end-container').style.display = 'none';
    document.getElementById('question-container').style.display = 'flex';
    document.getElementById('score-history-btn').style.display = 'block';
    document.getElementById('score-history').style.display = 'none';
    document.getElementById('score').textContent = '0';
    const choicesForm = document.getElementById('choices-form');
    choicesForm.innerHTML = '';
    const question = document.getElementById('question');
    question.innerHTML = '';
    document.getElementById('loding-question').style.display = 'block';

    console.log("you clicked restart button");
    startQuiz(user);
}

function displayQuiz(){
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('quiz-end-container').style.display = 'none';
    document.getElementById('question-container').style.display = 'flex';
}

function displayScoreHistory(){
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('quiz-end-container').style.display = 'flex';
    document.getElementById('question-container').style.display = 'none'; 
}


// Function to initialize the quiz
async function startQuiz(user) {
    const questions = await fetchQuestions();
    document.getElementById('loding-question').style.display = 'none';
    displayQuiz()
    const quiz = new Quiz(questions);

    const questionElement = document.getElementById('question');
    const choicesForm = document.getElementById('choices-form');
    const submitBtn = document.getElementById('submit-btn');
    const scoreElement = document.getElementById('score');
    const questionGenerator = quiz.generateQuestions();

    function displayCurrentQuestion() {
        const { value: currentQuestion, done } = questionGenerator.next();
        if (!done) {
            questionElement.innerHTML = decodeEntities(currentQuestion.question);
            choicesForm.innerHTML = ''; // Clear previous choices

            currentQuestion.choices.forEach((choice, index) => {
                const choiceInput = document.createElement('input');
                choiceInput.type = 'radio';
                choiceInput.name = 'choice';
                choiceInput.id = 'choice' + index;
                choiceInput.value = choice;
                const choiceLabel = document.createElement('label');
                choiceLabel.setAttribute('for', 'choice' + index);
                choiceLabel.innerHTML = decodeEntities(choice);
                choicesForm.appendChild(choiceInput);
                choicesForm.appendChild(choiceLabel);
                choicesForm.appendChild(document.createElement('br'));
            });

        } else {
            displayScoreHistory()
        
            // Display final score
            const finalScoreElement = document.getElementById('final-score');
            finalScoreElement.textContent = quiz.score;
        
            // Add score to user
            user.addScore(quiz.score);
        
            // Show score history button
            const scoreHistoryBtn = document.getElementById('score-history-btn');
        
            // Handle click event for score history button
            scoreHistoryBtn.addEventListener('click', function() {
                const scoreHistory = document.getElementById('score-history');
                scoreHistory.style.display = 'block'; // Show score history container
                scoreHistoryBtn.style.display = 'none'; // Hide score history button
        
                // Display score history if available
                const scores = user.getScoreHistory();
                if (scores.length > 0) {
                    // Transform each score into a string with a label and the score value
                    const scoresHtml = scores.map((score, index) => `Quiz ${index + 1} Score : ${score}`).join('<br>');
                    scoreHistory.innerHTML = `<p>${scoresHtml}</p>`;
                } else {
                    scoreHistory.innerHTML = '<p>No previous quiz scores.</p>';
                }
            });

            const restartQuizButton = document.getElementById('restart-quiz-btn');
            
            restartQuizButton.addEventListener('click', function() {
                restartQuiz(user);
            });
        }
    }

    submitBtn.onclick = function () {
        const selectedChoice = document.querySelector('input[name="choice"]:checked');
        if (selectedChoice) {
            quiz.submitAnswer(selectedChoice.value);
            scoreElement.textContent = quiz.score;
            displayCurrentQuestion();
        } else {
            alert('Please select an answer.');
        }
    };

    // Initial display
    displayCurrentQuestion();
}

function decodeEntities(encodedString) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = encodedString;
    return textArea.value;
}


function initializeQuiz() { 
    event.preventDefault();
    const usernameInput = document.getElementById('username-input').value.trim();
    console.log('Username input:', usernameInput);
    // Check if username is entered
    if (!usernameInput) {
        alert('Please enter your username.');
        return;
    }

    const user = new User(usernameInput);

    startQuiz(user)
}

document.getElementById('start-quiz-btn').addEventListener('click', initializeQuiz);