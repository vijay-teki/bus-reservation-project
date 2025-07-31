package com.busbooking.bus_reservation.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.busbooking.bus_reservation.model.User;
import com.busbooking.bus_reservation.repository.UserRepository;

@Service
public class LoginService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(User userDetails) {
        Optional<User> existing = userRepository.findByEmail(userDetails.getEmail());

        if (existing.isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Default role
        userDetails.setRole("USER");

        return userRepository.save(userDetails);
    }

    public User loginUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(password)) {
            throw new RuntimeException("Invalid email or password");
        }

        return userOpt.get();
    }
}