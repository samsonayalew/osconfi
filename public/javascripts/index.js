$(document).ready(function(){
//validation for file size
$.fn.validator.Constructor.VALIDATORS.filesize = function ($el) {
    var fileSizeMax = $el.data('filesize');
    if ($el[0].files[0] && $el[0].files[0].size>fileSizeMax) {
        return false;
    } else {
        return true;
    }
};
//validate upload FormData
$('#myForm').validator();

$('#mycarousel').carousel({
	interval:6000
});//mycarousel
$('#sponsors').carousel({
	interval:5000
});//sponsors
$('#corganizers').carousel({
	interval:5000
});//co-orgnaizers
$('.selector').on('change', function() {
	$.ajax({
		type:"POST",
		url: 'selectionchange',
		data: {"userchange": $(this).val(), "id": $(this).attr('id')},
		success:function(){
			//alert('success');
		}
	});
});
//role selection
$( ".roleselector" ).change(function(e){
  var value =  $(this).val();
  var id = e.target.id;
  $.ajax({
    method: "POST",
    url: "rolechange",
    data: { role: value, id: id }
  });
});
//select track for coordinator
$(".trackselector").change(function(e){
  var value =$(this).val();
  var id = e.target.id;
  $.ajax({
    method: "POST",
    url: "trackchange",
    data: {coordinator: value, track: id}
  });
});
//assign paper for writer
$('.assignpaper').change(function(e){

});

$('#loginsubmit').click(function(e){
  e.preventDefault();
  var email = $('#email').val();
  var password = $('#password').val();

  $.ajax({
    method: "POST",
    url: 'loginpost',
    async: false,
    data:{"email":email, "password":password},
    success: function(data){
      window.location.href = "/";
      //alert('success');
      return true;
    }, error: function (request, status, error) {
        // alert("your email or password is incorrect");
        $('.password').html('<ul class="list-unstyled" style="color:red;"><li>your email or password is invalid.</li></ul>')
        return false;
    }
  });
});
//registration submit
$('#registersubmit').validator().click(function(e){
  e.preventDefault();
  var option = $('#option').val();
  var email = $('#email').val();
  var firstname = $('#firstname').val();
  var middlename = $('#middlename').val();
  var lastname = $('#lastname').val();
  var title = $('#title').val();
  var phone = $('#phone').val();
  var organization = $('#organization').val();
  var position = $('#position').val();
  var country = $('#country').val();
  var address = $('#address').val();
  var password = $('#pass').val();

  $.ajax({
    method: "POST",
    url: 'register',
    async: false,
    data:{"option": option, "email":email, "firstname":firstname, "middlename":middlename,
    "lastname":lastname, "title":title, "phone":phone, "organization": organization,
    "position": position, "country":country, "address":address, "password":password},
    success: function(data){
      window.location.href = "/";
      //alert('success');
      return true;
    }, error: function (request, status, error) {
        // alert("your email or password is incorrect");
        //$('.email').html('<ul class="list-unstyled" style="color:red;"><li>this email addrss exists.</li></ul>');
        $('#pass').val('');
        $('#confpass').val('');
        return false;
    }
  });
});

//registration submit
$('#swiftcode').click(function(e){
  e.preventDefault();
  var swiftcode = $('#swift').val();
  $.ajax({
    method: "POST",
    url: 'verifycode',
    async: false,
    data:{"swiftcode":swiftcode},
    success: function(data){
      window.location.href = "/swift";
      //alert('success');
      return true;
    }, error: function (request, status, error) {
        // alert("your email or password is incorrect");
        //$('.email').html('<ul class="list-unstyled" style="color:red;"><li>this email addrss exists.</li></ul>');
        return false;
    }
  });
});

//inbox email change
$("tr[name='email']").click(function(e){
  //remove the classes
  this.attributes.removeNamedItem('class');
  //write to database
  e.preventDefault();
  var read = true;
  var date = this.id;
  $.ajax({
    method: "POST",
    url: 'emailread',
    async: false,
    data:{"read":read, "date":date}
  });
});

$("input[id='verified']").click(function(e){
  if(this.checked)
   $('#myModal').modal('show');
});

//modal yes button click
$('button[id="yesButton"]').click(function(e){
  $('#myModal').modal('hide');
  e.preventDefault();
  var email = this.name;
  $.ajax({
    method: "POST",
    url: 'emailNotification',
    async: false,
    data:{"email":email}
  });
});

$('#swiftsearch').click(function(e){
  e.preventDefault();
  var search = $('#search').val();
  $.ajax({
    method: "POST",
    url: 'verifyswiftcode',
    async: false,
    data:{"search":search},
    success: function(data){
        var listswift = $('.listswift')[0];
        listswift.innerHTML = '';
        if(data.forEach){
          data.forEach(function(value, index, array){
            if(value.verified === false){
              listswift.innerHTML = listswift.innerHTML + '<div style="border:solid #d50000 2px; color:#d50000; margin:20px; border-radius:7px;" class="codeitem">' +
              '<p align="center" style="font-weight:bold;" class="swift-user"> <span>' + value.firstname +' '+ value.middlename + ' (' + value.email + ')</span>' +
              '</p><p align="center" style="font-weight:bold;" class="swift-user">' + value.swiftcode + ' (Unverified)</p>' +
              '<p align="center"><input type="checkbox" id="verified" value="true"/>'+
              '<label for="verified">Verified</label>' +
              '</p>'+
              '<div id="myModal" role="dialog" class="modal fade" style="display: none;">'+
              '<div class="modal-dialog"><div class="modal-content">'+
              '<div class="modal-body">'+
              '<p align="center" style="margin:20px;font-weight:bold;">Send Email to the user about the SWIFT verification.</p>'+
              '</div>'+
              '<div class="modal-footer">'+
              '<button type="button" class="btn btn-success" id="yesButton">Yes</button>'+
              '<button type="button" data-dismiss="modal" class="btn btn-default" id="noButton">No</button>'+
              '</div></div></div></div>';
              $("input[id='verified']").click(function(e){
                if(this.checked)
                  $('#myModal').modal('show');
              });

              //modal yes button click
              $('button[id="yesButton"]').click(function(e){
                $('#myModal').modal('hide');
                e.preventDefault();
                var email = this.name;
                $.ajax({
                  method: "POST",
                  url: 'emailNotification',
                  async: false,
                  data:{"email":email}
                });
              });
              
            }else{
              listswift.innerHTML = listswift.innerHTML + '<div style="border:solid #37a000 2px; margin:20px; border-radius:7px;" class="codeitem">' +
                                    '<p align="center" style="color:#37a000;font-weight:bold;" class="swift-user">' +
                                    '<span>' + value.firstname +' '+ value.middlename + ' (' + value.email + ')</span></p>' +
                                    '<p align="center" style="color:#37a000;font-weight:bold;" class="swift-user">' + value.swiftcode + '(verified)</p>' +
                                    '<p align="center"></p></div>';
            }
          });
        }
        return true;
    }, error: function (request, status, error) {
        return false;
    }
  });
});//swift search

});//all document
