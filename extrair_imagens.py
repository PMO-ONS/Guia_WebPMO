# -*- coding: utf-8 -*-
"""
Extrai as imagens do "Guia do usuário do WebPMO.docx" para a pasta images/.

Um arquivo .docx é, na prática, um arquivo ZIP: as imagens ficam em
word/media/ já com os nomes (image2.png, image6.svg, ...) usados pelo
conteudo.md. O script apenas copia as que o guia utiliza.

USO:
    python extrair_imagens.py "Guia do usuário do WebPMO.docx"

Requisitos: apenas Python 3 (biblioteca padrão).
"""

import os
import re
import shutil
import sys
import zipfile

DESTINO = "images"

# Imagens efetivamente referenciadas pelo conteudo.md
USADAS = [
    "image2.png", "image3.png", "image4.png", "image6.svg", "image8.svg",
    "image9.png", "image10.png", "image12.svg", "image14.svg", "image16.svg",
    "image18.svg", "image20.svg", "image21.png", "image22.png", "image23.png",
    "image24.png", "image25.png", "image27.png", "image28.png", "image29.png",
    "image30.png", "image31.png", "image32.png", "image33.png", "image34.png",
    "image36.svg", "image38.svg", "image40.svg", "image41.png", "image42.png",
    "image44.svg", "image46.svg", "image47.png", "image49.svg", "image51.svg",
    "image53.svg", "image54.png", "image55.png", "image57.svg", "image59.svg",
    "image60.png", "image61.png", "image62.png", "image63.png", "image65.svg",
    "image67.svg", "image68.png", "image69.png", "image71.svg", "image73.svg",
    "image74.png", "image75.png", "image76.png", "image78.svg", "image80.svg",
    "image82.svg", "image83.png", "image84.png", "image85.png", "image86.png",
]


def referenciadas_no_md(caminho="conteudo.md"):
    """Lê o conteudo.md e devolve a lista real de imagens referenciadas."""
    if not os.path.exists(caminho):
        return USADAS
    texto = open(caminho, encoding="utf-8").read()
    achadas = re.findall(r'!\[[^\]]*\]\(images/([^)]+)\)', texto)   # ![...](images/x)
    achadas += re.findall(r'src="images/([^"]+)"', texto)            # HTML bruto
    achadas += re.findall(r'::qr:images/([^:]+)::', texto)           # marcador de QR
    achadas = sorted(set(a for a in achadas if a != "ons_logo.png"))
    return achadas or USADAS


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    docx = sys.argv[1]
    if not os.path.exists(docx):
        print("ERRO: arquivo nao encontrado: %s" % docx)
        sys.exit(1)

    alvo = referenciadas_no_md()
    os.makedirs(DESTINO, exist_ok=True)

    copiadas, faltando = [], []
    with zipfile.ZipFile(docx) as z:
        disponiveis = {
            os.path.basename(n): n
            for n in z.namelist()
            if n.startswith("word/media/")
        }
        for nome in alvo:
            if nome in disponiveis:
                with z.open(disponiveis[nome]) as src, \
                     open(os.path.join(DESTINO, nome), "wb") as dst:
                    shutil.copyfileobj(src, dst)
                copiadas.append(nome)
            else:
                faltando.append(nome)

    print("Imagens copiadas para %s/: %d" % (DESTINO, len(copiadas)))
    if faltando:
        print("ATENCAO - nao encontradas no .docx (%d):" % len(faltando))
        for n in faltando:
            print("   - %s" % n)
    else:
        print("Todas as imagens referenciadas foram extraidas com sucesso.")

    logo = os.path.join(DESTINO, "ons_logo.png")
    if not os.path.exists(logo):
        print("\nLembrete: copie a logo do ONS para %s" % logo)


if __name__ == "__main__":
    main()
