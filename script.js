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
    const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
    const data = await response.json();
    return data.results.map(q => ({
        question: q.question,
        choices: [...q.incorrect_answers, q.correct_answer],
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty // Assumed difficulty is provided and mapped correctly to 'easy', 'medium', 'hard'
    }));
}

// Function to initialize the quiz
async function startQuiz() {
    event.preventDefault();
    const usernameInput = document.getElementById('username-input').value.trim();
    console.log('Username input:', usernameInput);
    // Check if username is entered
    if (!usernameInput) {
        alert('Please enter your username.');
        return;
    }

    const questions = await fetchQuestions();
    const user = new User(usernameInput);
    const quiz = new Quiz(questions);

    const questionElement = document.getElementById('question');
    const choicesForm = document.getElementById('choices-form');
    const submitBtn = document.getElementById('submit-btn');
    const scoreElement = document.getElementById('score');
    const nextBtn = document.getElementById('next-btn');

    // Hide username container and show quiz container
    document.getElementById('username-container').style.display = 'none';
    document.getElementById('question-container').style.display = 'flex';

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

            submitBtn.style.display = 'block';
        } else {
            document.getElementById('username-container').style.display = 'none'; // Hide username container
            document.getElementById('question-container').style.display = 'none'; // Hide question container
            const quizEndContainer = document.getElementById('quiz-end-container');
            quizEndContainer.style.display = 'flex'; // Show quiz end container
        
            // Display final score
            const finalScoreElement = document.getElementById('final-score');
            finalScoreElement.textContent = quiz.score;
        
            // Add score to user
            user.addScore(quiz.score);
        
            // Show score history button
            const scoreHistoryBtn = document.getElementById('score-history-btn');
            scoreHistoryBtn.style.display = 'block';
        
            // Handle click event for score history button
            scoreHistoryBtn.addEventListener('click', function() {
                const scoreHistory = document.getElementById('score-history');
                scoreHistory.style.display = 'block'; // Show score history container
                scoreHistoryBtn.style.display = 'none'; // Hide score history button
        
                // Display score history if available
                const scores = user.getScoreHistory();
                if (scores.length > 0) {
                    scoreHistory.innerHTML = '<p>' + scores.join(', ') + '</p>';
                } else {
                    scoreHistory.innerHTML = '<p>No previous quiz scores.</p>';
                }
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


function showScoreHistory(){
    
}


// Add an event listener to the "Start Quiz" button
document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);