## Proč náš formát?

Věříme, že obsah má patřit tvůrci a divákovi – ne platformě. Chceme tvůrcům poskytnout moderní nástroje, které chrání jejich publikum před reklamami a algoritmy, o které nikdo nestál.

*Hodina šachového videa? 20 MB – a nastylovat si ho můžete až při přehrávání, podle platformy a vlastních preferencí.*

## 1. Specifikace

**Náš formát** je velmi jednoduchá specifikace výukového obsahu postavená na základních formátech jako je JSON, ZIP, nejjednodušší je si výsledný soubor zobrazit v prohlížeči souborů.

## 2. Rozšířitelnost

Formát je **rozšířitelný**: můžete zavádět nové typy bloků (`type`). Čtečky, které typ neznají, ho mohou ignorovat nebo zobrazit náhradní obsah. Specifikace zůstává jednoduchá a zároveň umožňuje vlastní bloky.

## 3. Balíček článku

**article.zip** obsahuje **content.zip** s obsahem článku. Volitelně může obsahovat třeba **podpisovou** část pro **content** nebo libovolná další data dle vaší potřeby.
