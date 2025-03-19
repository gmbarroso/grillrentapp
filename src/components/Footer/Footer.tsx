import "./Footer.css"

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; Chácara Sacopã. Rua Sacopã, 852, Lagoa - Rio de Janeiro - RJ - 22471-180</p>
      <div className="social-links">
        <a href="https://www.linkedin.com/your-profile" target="_blank" rel="noopener noreferrer">
          {/* <img src={linkedinLogo || "/placeholder.svg"} alt="LinkedIn" className="social-logo" /> */}
        </a>
        <a href="https://github.com/gmbarroso/grillrentapp" target="_blank" rel="noopener noreferrer">
          <img src="/images/github-logo.svg" alt="GitHub" className="social-logo" />
        </a>
      </div>
    </footer>
  )
}

export default Footer

