import { Component } from 'react';
import { Link } from 'react-router-dom';
import AvisoError from '../AvisoError/AvisoError';
import { IconoInicio } from '../Iconos/Iconos';
import estilos from './LimiteError.module.css';

class LimiteError extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        console.error('Error de renderizado capturado por LimiteError:', error, info);
    }

    reintentar = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <section className={estilos.contenedor} aria-live="assertive">
                    <AvisoError
                        titulo="Ocurrió un inconveniente al mostrar esta pantalla"
                        mensaje="Detectamos un dato inesperado al armar la vista. Podés reintentar ahora o volver al panel de inicio."
                        onReintentar={this.reintentar}
                    />
                    <div className={estilos.acciones}>
                        <Link to="/inicio" className={estilos.enlaceInicio} onClick={this.reintentar}>
                            <IconoInicio size={17} />
                            <span>Volver al inicio</span>
                        </Link>
                    </div>
                </section>
            );
        }

        return this.props.children;
    }
}

export default LimiteError;
