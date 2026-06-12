package com.eggblue.app.activities
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.MainActivity
import com.eggblue.app.databinding.ActivityRegisterBinding
import com.eggblue.app.utils.FirebaseHelper
class RegisterActivity : AppCompatActivity() {
    private lateinit var binding: ActivityRegisterBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)
        binding.btnRegister.setOnClickListener {
            val e = binding.etEmail.text.toString().trim()
            val p = binding.etPassword.text.toString().trim()
            val cp = binding.etConfirmPassword.text.toString().trim()
            if(e.isEmpty() || p.length < 6) { Toast.makeText(this, "Email sai hoặc mật khẩu <6 ký tự", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            if(p != cp) { Toast.makeText(this, "Mật khẩu không khớp", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
            FirebaseHelper.auth.createUserWithEmailAndPassword(e, p).addOnCompleteListener { t ->
                if(t.isSuccessful) {
                    FirebaseHelper.db.collection("users").document(FirebaseHelper.currentUserUid!!).set(mapOf("email" to e))
                    startActivity(Intent(this, MainActivity::class.java)); finish()
                } else Toast.makeText(this, "Lỗi: ${t.exception?.message}", Toast.LENGTH_SHORT).show()
            }
        }
        binding.tvBackToLogin.setOnClickListener { finish() }
    }
}