type FooterProps = {
  total: number;
  completed: number;
  pending: number;
};

function Footer(props: FooterProps) {
  return (
    <footer className="footer">
      <span>Total: {props.total}</span>
      <span>Completadas: {props.completed}</span>
      <span>Pendientes: {props.pending}</span>
    </footer>
  );
}

export default Footer;