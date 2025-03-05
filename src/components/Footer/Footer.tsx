import "./Footer.css"
import linkedinLogo from "../../assets/linkedin-logo.png"
import githubLogo from "../../assets/github-logo.png"

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; 2025 Grill Rent App. All rights reserved.</p>
      <div className="social-links">
        <a href="https://www.linkedin.com/your-profile" target="_blank" rel="noopener noreferrer">
          {/* <img src={linkedinLogo || "/placeholder.svg"} alt="LinkedIn" className="social-logo" /> */}
        </a>
        <a href="https://github.com/your-profile" target="_blank" rel="noopener noreferrer">
          {/* <img src={githubLogo || "/placeholder.svg"} alt="GitHub" className="social-logo" /> */}
        </a>
      </div>
    </footer>
  )
}

export default Footer

