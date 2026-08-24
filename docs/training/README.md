# SCORA Training Pack

Trainer-ready guides in **Markdown** and **PowerPoint**:

| Guide | Markdown | PowerPoint | Audience |
|---|---|---|---|
| User (GSPN) | [USER_GUIDE.md](./USER_GUIDE.md) | [SCORA_User_Training.pptx](./SCORA_User_Training.pptx) | Engineers — login, profile, tips, dwell time |
| Admin | [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) | [SCORA_Admin_Training.pptx](./SCORA_Admin_Training.pptx) | Operators — full admin portal walkthrough |

Screenshots folder: [snaps/](./snaps/)

Regenerate decks after guide or snap updates:

```bash
npm run build:training-pptx
```

## How to use in a live training

1. Present **SCORA_User_Training.pptx** for ASC staff (~20 min).  
2. Present **SCORA_Admin_Training.pptx** for admins (45–60 min).  
3. Markdown guides remain the detailed reference; PPTs embed the same screenshots.
