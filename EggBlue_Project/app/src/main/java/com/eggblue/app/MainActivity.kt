package com.eggblue.app
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.eggblue.app.databinding.ActivityMainBinding
import com.eggblue.app.fragments.*
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, HomeFragment()).commit()
        binding.bottomNav.setOnItemSelectedListener { item ->
            when(item.itemId) {
                com.eggblue.app.R.id.nav_home -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, HomeFragment()).commit(); true }
                com.eggblue.app.R.id.nav_diary -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, DiaryFragment()).commit(); true }
                com.eggblue.app.R.id.nav_ai -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, AIChatFragment()).commit(); true }
                com.eggblue.app.R.id.nav_account -> { supportFragmentManager.beginTransaction().replace(com.eggblue.app.R.id.fragmentContainer, AccountFragment()).commit(); true }
                else -> false
            }
        }
    }
}