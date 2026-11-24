import { useEffect, useId, useRef } from 'react';
import estilos from './Confirmacion.module.css';

function Confirmacion({
    abierta,
    titulo,
    mensaje,
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    onConfirmar,
    onCancelar,
    ocupado = false,
    peligro = false,
}) {
    const dialogoRef = useRef(null);
    const idTitulo = useId();
    const idMensaje = useId();

    useEffect(() => {
        const dialogo = dialogoRef.current;
        if (!dialogo) return;
        if (abierta && !dialogo.open) dialogo.showModal();
        if (!abierta && dialogo.open) dialogo.close();
    }, [abierta]);

    const cancelar = () => {
        if (!ocupado) onCancelar();
    };

    const alHacerClick = (evento) => {
        if (evento.target === dialogoRef.current) cancelar();
    };

    const alPresionarEscape = (evento) => {
        evento.preventDefault();
        cancelar();
    };

    return (
        <dialog
            ref={dialogoRef}
            className={estilos.dialogo}
            aria-labelledby={idTitulo}
            aria-describedby={idMensaje}
            onCancel={alPresionarEscape}
            onClick={alHacerClick}
        >
            <div className={estilos.caja}>
                <h2 id={idTitulo} className={estilos.titulo}>{titulo}</h2>
                <p id={idMensaje} className={estilos.mensaje}>{mensaje}</p>
                <div className={estilos.acciones}>
                    <button type="button" className={estilos.botonCancelar} onClick={cancelar} disabled={ocupado}>
                        {textoCancelar}
                    </button>
                    <button
                        type="button"
                        className={peligro ? estilos.botonPeligro : estilos.botonConfirmar}
                        onClick={onConfirmar}
                        disabled={ocupado}
                    >
                        {textoConfirmar}
                    </button>
                </div>
            </div>
        </dialog>
    );
}

export default Confirmacion;
