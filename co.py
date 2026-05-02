```python
import speech_recognition as sr
from transformers import pipeline
from pyttsx3 import Engine
import json

# Initialisation du moteur de voix (synthèse)
engine = Engine()
r = sr.Recognizer()

# Chargement d'un modèle de langage pour la conversation
chat_pipeline = pipeline("conversational", model="microsoft/DialoGPT-small")


def listen():
    """Écoute le son provenant du micro et convertit en texte."""
    with sr.Microphone() as source:
        print("\n--- Écoute... ---")
        r.adjust_for_ambient_noise(source)
        audio = r.listen(source, timeout=5)
    try:
        text = r.recognize_google(audio, language="fr-FR")
        return text.lower()
    except sr.UnknownValueError:
        print("Incompréhensible...")
        return ""
    except sr.RequestError as e:
        print(f"Erreur API: {e}")
        return ""


def speak(text):
    """Synthétise le texte en voix."""
    engine.say(text)
    engine.runAndWait()


class GirlfriendAI:
    def __init__(self, name="Copine"):
        self.name = name
        self.messages = []  # Historique des messages pour garder le contexte
        self.mood = "calme"  # État d'humeur (optionnel, pour ajouter de la personnalité)
        
    def interact(self):
        """Lance une interaction complète : Écoute -> Réponse -> Parole."""
        user_input = listen()
        if not user_input:
            return

        print(f"--- Vous dites : '{user_input}' ---")
        speak(user_input)  # Reprendre la parole pour montrer qu'elle t'écoute (optionnel)

        response_text = chat_pipeline.generate(
            [self.messages], 
            text=user_input,
            do_sample=True,
            max_length=250,
            repetition_penalty=1.2,
            temperature=0.7
        )
        
        if isinstance(response_text, tuple):
            response_text = response_text[0]

        # Mise à jour du contexte
        self.messages.append({"role": "user", "content": user_input})
        
        reply = response_text.strip()
        print(f"--- Elle répond : '{reply}' ---")
        speak(reply)  # Optionnel: la faire parler


# Création et lancement de l'assistante
gf = GirlfriendAI(name="Copine")

print("Bienvenue ! Appuie sur Entrée pour commencer.")
while True:
    try:
        input()  # Attend une touche
        gf.interact()
    except KeyboardInterrupt:
        print("\nFin de la session. Au revoir, ma belle.")
        break


```
