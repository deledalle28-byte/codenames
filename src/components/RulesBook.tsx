"use client";

import { useState } from "react";

const sections = [
  {
    title: "🎯 But du jeu",
    content:
      "Chaque équipe doit retrouver ses agents secrets sur le plateau pour marquer des points. Chaque agent trouvé = 1 point. Compléter sa mission secrète rapporte 3 points bonus. Révéler l'Assassin coûte 5 points. L'équipe avec le plus de points à la fin des manches gagne !",
  },
  {
    title: "🔄 Déroulement d'un tour",
    content:
      "Chaque tour se déroule en deux phases :\n\n1. **Phase Indice** — Le Spymaster donne un indice : un mot unique + un nombre (le nombre d'agents visés).\n\n2. **Phase Devinette** — Les coéquipiers révèlent des cartes sur le plateau. Ils ont droit au nombre indiqué + 1 essais.\n\nLes équipes jouent à tour de rôle.",
  },
  {
    title: "💬 Règles des indices",
    content:
      "L'indice doit être un **mot unique**. Il est interdit de donner un mot qui contient (ou est contenu dans) un mot visible sur le plateau.\n\nExemple : si « ORANGE » est sur le plateau, les indices « RANG », « ORANGE » ou « ORANGEADE » sont interdits.",
  },
  {
    title: "🔍 Devinettes",
    content:
      "L'équipe peut révéler jusqu'à **nombre + 1** cartes.\n\n• **Agent allié** → +1 point, on continue.\n• **Carte neutre** → le tour s'arrête immédiatement.\n• **Agent ennemi** → le tour s'arrête.\n• **Assassin** → **-5 points** et le tour s'arrête !\n\nAppuyer sur **Stop** pour passer son tour volontairement.",
  },
  {
    title: "💀 L'Assassin",
    content:
      "Il y a une carte Assassin (violette) sur le plateau. Si une équipe la révèle, elle subit une **pénalité de -5 points** et son tour s'arrête.\n\nL'Assassin **change de position** à chaque fin de tour en échangeant avec une carte neutre non révélée. Attention, il bouge constamment !",
  },
  {
    title: "🎖️ Missions secrètes",
    content:
      "Chaque équipe reçoit une **mission secrète** au début de chaque manche. Compléter la mission rapporte **3 points bonus**.\n\nExemples de missions :\n• Donner 3 indices dans la manche\n• Révéler 3 agents en un seul tour\n• Terminer un tour sans erreur\n• Révéler un agent avec le guess bonus (+1)\n• Révéler 2 cartes neutres dans la manche",
  },
  {
    title: "🏆 Victoire",
    content:
      "Le match se joue sur un nombre de manches configurable. À la fin de toutes les manches, l'équipe avec le **plus de points** gagne !\n\n**Calcul des points :**\n• +1 point par agent allié trouvé\n• +3 points bonus si la mission secrète est complétée\n• -5 points si l'Assassin est révélé\n\nUne manche se termine quand une équipe a trouvé tous ses agents ET complété sa mission.",
  },
  {
    title: "🕵️ Spymaster",
    content:
      "Le Spymaster est le joueur qui donne les indices. Il voit la grille complète (couleurs secrètes de toutes les cartes).\n\nLe rôle de Spymaster **tourne** entre les joueurs d'une même équipe à chaque nouvelle manche.",
  },
];

function RulesContent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="grid gap-1">
      {sections.map((section, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-200 transition hover:bg-white/[0.04]"
              onClick={() => setOpenIndex(isOpen ? null : i)}
            >
              <span>{section.title}</span>
              <span
                className={`text-xs text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              >
                ▼
              </span>
            </button>
            {isOpen && (
              <div
                className="px-3 pb-3 text-sm leading-relaxed text-slate-400"
                style={{ animation: "fade-in 0.2s ease-out" }}
              >
                {section.content.split("\n").map((line, j) => (
                  <p key={j} className={line === "" ? "mt-2" : ""}>
                    {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={k} className="font-semibold text-slate-200">
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <span key={k}>{part}</span>
                      ),
                    )}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function RulesBook() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/30 bg-purple-900/60 text-xl shadow-lg shadow-purple-500/20 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
        style={{ animation: "float 3s ease-in-out infinite" }}
        title="Règles du jeu"
      >
        📖
      </button>

      {/* Overlay + sliding panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/[0.08] bg-slate-950/95 shadow-2xl backdrop-blur-lg"
            style={{ animation: "slideInRight 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                🕵️ Règles du jeu
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <RulesContent />
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.08] px-5 py-3">
              <p className="text-center text-xs text-slate-600">
                Codename 2.0 — Bonne partie ! 🎲
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
