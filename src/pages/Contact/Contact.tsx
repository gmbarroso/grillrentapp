import { useTranslation } from "react-i18next"
import "./Contact.css"

const Contact = () => {
  const { t } = useTranslation()

  return (
    <div className="contact-container">
      <h2>{t("Contact.Title")}</h2>
      <p>{t("Contact.Intro")}</p>
      <ul>
        <li>{t("Contact.Email")}</li>
        <li>{t("Contact.Phone")}</li>
        <li>{t("Contact.Address")}</li>
      </ul>
      <p>{t("Contact.Hours")}</p>
    </div>
  )
}

export default Contact

