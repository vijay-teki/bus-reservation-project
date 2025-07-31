package com.busbooking.bus_reservation.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.busbooking.bus_reservation.model.Bus;
import com.busbooking.bus_reservation.model.Reservation;
import com.busbooking.bus_reservation.repository.BusRepository;
import com.busbooking.bus_reservation.repository.ReservationRepository;

@Service
public class BusService {

    @Autowired
    private BusRepository busRepository;
    
    @Autowired
    private ReservationRepository reservationRepository; // Inject ReservationRepository

    public Bus addBus(Bus bus) {
        // The user's front-end does not send 'seatsAvailable', so it's better to handle this logic here.
        // Assuming the Bus model has a 'seatsAvailable' field. If not, this line can be removed.
        bus.setSeatsAvailable(bus.getTotalSeats()); 
        return busRepository.save(bus);
    }

    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }

    public List<Bus> searchBuses(String source, String destination) {
        return busRepository.findBySourceAndDestination(source, destination);
    }

    // --- FIX: ADDED THIS ENTIRE METHOD ---
    public Bus updateBus(String id, Bus busDetails) {
        // Find the existing bus in the database, or throw an exception if not found.
        Bus existingBus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found with id: " + id));

        // Update the properties of the existing bus with the new details from the request.
        existingBus.setBusNumber(busDetails.getBusNumber());
        existingBus.setSource(busDetails.getSource());
        existingBus.setDestination(busDetails.getDestination());
        existingBus.setDepartureTime(busDetails.getDepartureTime());
        existingBus.setTotalSeats(busDetails.getTotalSeats());
        existingBus.setPrice(busDetails.getPrice());
        
        // Note: You might need additional logic here if changing total seats affects existing bookings.
        // For example, what happens if total seats are reduced below the number of booked seats?
        // For now, this implementation directly updates the values as requested by the front-end.

        // Save the updated bus object back to the database.
        return busRepository.save(existingBus);
    }
    
    public String deleteBus(String busId) {
        Optional<Bus> busOpt = busRepository.findById(busId);
        if (busOpt.isEmpty()) {
            throw new RuntimeException("Bus not found");
        }

        // This is a good practice to prevent deleting buses with active bookings.
        List<Reservation> activeReservations = reservationRepository.findByBusIdAndStatus(busId, "BOOKED");
        if (!activeReservations.isEmpty()) {
            throw new RuntimeException("Cannot delete bus: Active reservations exist. Please cancel them first.");
        }

        busRepository.deleteById(busId);
        return "Bus deleted successfully!";
    }
}
