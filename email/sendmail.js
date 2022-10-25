import { setApiKey, send } from "@sendgrid/mail";

setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    send({
      to: email,
      from: "Hoang Dao and Vinh Pham",
      subject: "Thanks for using our Task Manager App",
      text: `Welcome to our Task manager app, ${name}.
      We hope you like it.
      
      Best regards,
      Hoang Dao and Vinh Pham
      `
    });
  };
  
  const sendCancelationMail = (email, name) => {
    send({
      to: email,
      from: "Hoang Dao and Vinh Pham",
      subject: "Sorry to see you go",
      text: `We hope to see you again, ${name}.`
    });
  };
  
  export default {
    sendWelcomeMail,
    sendCancelationMail
  };