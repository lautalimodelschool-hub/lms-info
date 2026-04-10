export const sendOTP = async (phone: string, otp: string) => {
  const apiKey = import.meta.env.VITE_SMS_API_KEY;
  const senderId = import.meta.env.VITE_SMS_SENDER_ID;
  
  if (!apiKey || !senderId) {
    return { success: false, message: "SMS API configuration missing" };
  }

  // Ensure phone number is in correct format (e.g., 88017...)
  // Remove any non-digit characters
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('88') ? cleanPhone : `88${cleanPhone}`;
  
  const message = `Your OTP for Lautoli Model School is ${otp}`;
  const url = `/api/sms/send?api_key=${apiKey}&type=text&number=${formattedPhone}&senderid=${senderId}&message=${encodeURIComponent(message)}`;

  console.log(`Sending OTP to ${formattedPhone} via proxy...`);

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("SMS API Response:", data);

    if (data.response_code === 202 || data.success === true || data.status === "success") {
      return { success: true, message: "OTP sent successfully" };
    } else {
      return { success: false, message: data.msg || data.message || data.success_message || "Failed to send OTP" };
    }
  } catch (error) {
    console.error("SMS API Error:", error);
    return { success: false, message: "Network error while sending OTP. Please check your internet connection." };
  }
};
